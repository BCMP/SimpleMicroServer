# -*- coding: utf-8 -*-
import signal

from gevent.pywsgi import WSGIServer
from gevent import monkey

monkey.patch_all()  # 用于协程异步感知IO操作，打的补丁
import json
import uuid
from lib.proxies import FlaskPooledClusterRpcProxy
from flask import Flask, render_template, jsonify, request, send_from_directory, redirect, flash, url_for
import time
import datetime
from config import *
import threading
import subprocess
from ruamel import yaml
import atexit
import psutil
from flask_login import LoginManager, UserMixin, login_required, login_user, logout_user, current_user
from Web import user
import sqlite3
from functools import wraps
import platform

'''
Flask与request用于简单的web接口开发
WSGI和gevent用于异步请求的高并发
monkey则用于打补丁，让协程可以更全面地感知IO操作，遇到则进行切换，提高并发能力，
thread=False则是为了防止阻塞到其他的线程和进程操作，彼此不影响。
'''


# <-----------------------------------|初始化flask、导入配置参数、初始化登录插件|----------------------------------->#
# create_app用于创建app，并做简单配置，最主要的是NAMEKO_AMQP_URI的地址配置。
def create_app(name):
    flask_app = Flask(name)
    flask_app.config['JSON_SORT_KEYS'] = False
    flask_app.config['JSON_AS_ASCII'] = False
    flask_app.config.update(dict(
        NAMEKO_AMQP_URI="pyamqp://guest:guest@localhost",
        NAMEKO_INITIAL_CONNECTIONS=5,  # 要创建的 Nameko 集群的初始连接数
        NAMEKO_MAX_CONNECTIONS=10,  # 最大连接数
        NAMEKO_CONNECT_ON_METHOD_CALL=True,
        # NAMEKO_RPC_TIMEOUT=cfg.time_out,
        # NAMEKO_POOL_RECYCLE=2
    ))
    return flask_app


cfg = Config()  # 配置文件
app = create_app('main')
app._static_folder = './static'
ServerDict = dict()  # 用于存放flask——nameko的连接池（一个池中有10个连接）
# 导入蓝图对象
app.register_blueprint(user, url_prefix='/user')
# 实例化flask登录插件
login_manager = LoginManager()
# 初始化登录插件
login_manager.init_app(app)
# 告诉login插件认证失败是跳转的页面,将登陆页面的视图函数的endpoint告诉login插件
login_manager.login_view = 'login'
# 跳转后提示信息的定义
login_manager.login_message = '请先登录或注册'

plat = platform.system().lower()
if plat == 'windows':
    print('项目运行于windows系统\n')
elif plat == 'linux\n':
    print('项目运行于linux系统')


# <-----------------------------------|初始化服务状态记录字典|----------------------------------->#
# 服务类，用于记录服务状态
class serverstatus:
    def __init__(self):
        self.name = None  # 名称
        self.status = False  # 状态
        self.worker_num = 0  # 当前工作数量
        self.time = 0  # 最后更新时间
        self.group = None  # 组别
        self.pid = None  # pid


class ServerStatusClass(object):  # 可自定义变量初始化和复制时的操作，但没用上
    def __init__(self):
        self._ServerStatus = dict()

    @property
    def ServerStatus(self):
        return self._ServerStatus

    @ServerStatus.setter
    def ServerStatus(self, value):
        self._ServerStatus = value


ServerStatus = ServerStatusClass().ServerStatus  # 相当于是ServerStatus =dict()，用于存储记录各个服务的基本情况
app.secret_key = 'secret_key'  # 设置表单交互密钥


# <-----------------------------------|实现登录控制|----------------------------------->#
# 人员数据库查询
class UserService:
    conn = sqlite3.connect("person.db")
    cur = conn.cursor()

    @classmethod
    def query_user_by_name(cls, username):
        result = cls.cur.execute(
            "SELECT person_id,username,password,type from person_info where username = '{}'".format(username))
        # self.conn.close()
        res = result.fetchall()
        cls.conn.commit()
        if len(res) > 0:
            user = dict()
            user.update({'id': res[0][0]})
            user.update({'username': res[0][1]})
            user.update({'password': res[0][2]})
            user.update({'usertype': res[0][3]})
            return user
        return None

    @classmethod
    def query_user_by_id(cls, user_id):
        result = cls.cur.execute(
            "SELECT person_id,username,password,type from person_info where person_id = {}".format(user_id))
        # self.conn.close()
        res = result.fetchall()
        cls.conn.commit()
        if len(res) > 0:
            user = dict()
            user.update({'id': res[0][0]})
            user.update({'username': res[0][1]})
            user.update({'password': res[0][2]})
            user.update({'type': res[0][3]})
            return user
        return None

    @classmethod
    def add_user(cls, name, username, password, type):
        cls.cur.execute(
            "INSERT INTO person_info (person_name,username,password,type,valid) VALUES ('{}', '{}', '{}',{},1)".format(
                name,
                username,
                password, type))
        cls.conn.commit()


# 编写用户类
class User(UserMixin):
    username = ''
    level_limit = 0
    pass


# 加载用户, login_required 需要查询用户信息
@login_manager.user_loader
def user_loader(user_id: int):
    result = UserService.query_user_by_id(user_id)
    if result is not None:
        curr_user = User()
        curr_user.username = result['username']
        curr_user.id = user_id
        curr_user.level_limit = result['type']
        return curr_user


# 登录
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        user = UserService.query_user_by_name(username)
        print(username, user, request.form['password'])
        if user is not None and request.form['password'] == user['password']:
            curr_user = User()
            curr_user.username = username
            curr_user.id = user['id']
            curr_user.level_limit = user['usertype']
            # 通过Flask-Login的login_user方法登录用户
            login_user(curr_user)

            # 登录成功后重定向
            next_url = request.args.get('next')
            if current_user.level_limit >= 1:
                return redirect(next_url or url_for('user.MainPage', username=username))
            else:
                return render_template('./login.html')
        else:
            return render_template('./login.html')
    else:
        # GET 请求
        return render_template('./login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        username = request.form.get('username')
        password = request.form.get('password')
        repassword = request.form.get('repassword')
        result = {"status": 0}
        if password != repassword:
            result.update({"message": "两次密码输入不一致"})
        user = UserService.query_user_by_name(username)
        print(user)
        if user is None:
            UserService.add_user(name, username, password, 0)
            # 登录成功后重定向
            result.update({"status": 1})
            result.update({"message": "注册成功"})
        else:
            result.update({"message": "用户名已存在"})
        return result
    else:
        # GET 请求
        return render_template('./register.html')


# 登出功能实现
@app.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    # 通过Flask-Login的logout_user方法登出用户
    logout_user()
    return redirect(url_for('login'))


# 6、访问控制
@app.route('/', methods=['GET', 'POST'])
@login_required
def index():
    username = current_user.username
    return redirect(url_for('user.MainPage', username=username))


# <-----------------------------------|软件登录接口|----------------------------------->#

@app.route('/app_login', methods=['POST'])
def app_login():
    if request.method == 'POST':
        username = request.form.get('username')
        user = UserService.query_user_by_name(username)
        print(username, user, request.form['password'])
        if user is not None and request.form['password'] == user['password']:
            curr_user = User()
            curr_user.username = username
            curr_user.id = user['id']
            curr_user.level_limit = user['usertype']
            # 通过Flask-Login的login_user方法登录用户
            login_user(curr_user)
            if current_user.level_limit >= 1:
                return {'status': 1}  # 登陆成功
            else:
                return {'status': 2}  # 权限不够
        else:
            return {'status': 0}  # 登陆失败


@app.route('/app_register', methods=['GET', 'POST'])
def app_register():
    if request.method == 'POST':
        name = request.form.get('name')
        username = request.form.get('username')
        password = request.form.get('password')
        repassword = request.form.get('repassword')
        result = {"status": 0}
        if password != repassword:
            result.update({"status": 0})  # 两次密码输入不一致
            result.update({"message": "两次密码输入不一致"})
        user = UserService.query_user_by_name(username)
        print(user)
        if user is None:
            UserService.add_user(name, username, password, 0)
            # 登录成功后重定向
            result.update({"status": 1})  # 注册成功
        else:
            result.update({"status": 2})  # 用户名已存在
        return result


# 登出功能实现
@app.route('/app_logout', methods=['GET', 'POST'])
@login_required
def app_logout():
    # 通过Flask-Login的logout_user方法登出用户
    logout_user()
    return 200


# <-----------------------------------|微服务管理接口|----------------------------------->#
# 返回网页更新所需要的数据
@app.route('/getdata', methods=['POST'])
@login_required
def getdata():
    # 服务数量、电脑信息、服务具体信息
    data = {'Service': [], 'ComputerInfo': [], 'ServiceInfo': []}
    service = []
    for value in ServerStatus.values():
        for server in value.values():
            for i in server:
                temp = []
                temp.append(i.group)
                temp.append(i.name)
                temp.append(i.status)
                temp.append(time.strftime('%Y-%m-%d  %H:%M:%S', time.localtime(i.time)))
                temp.append(i.worker_num)
                service.append(temp)
    data['Service'] = service

    Info = []
    Info.append(psutil.cpu_percent())
    data['ComputerInfo'] = Info
    return json.dumps(data)


# 心跳函数，用于接受服务的心跳信号，判断服务是否存活
@app.route('/heartbeat', methods=['POST'])
def heartbeat():
    data = json.loads(request.get_data(as_text=True))
    server = data['server']  # 服务名（不是服务实例名），name为服务实例名
    group = data['group']  # 组别
    flag = False
    if group not in ServerStatus[server].keys():  # 没有该组别则新增
        ServerStatus[server].update({group: []})
    if len(ServerStatus[server][group]) > 0:  # 该服务组别中有服务实例
        for i in ServerStatus[server][group]:
            if i.name == data['name']:  # 判断服务实例名与发送心跳信号的服务实例名是否相同
                flag = True
                if not i.status:  # 之前判断是否存活
                    i.status = True
                    i.worker_num = 0
                    i.group = group
                    i.time = time.time()
                    print(server + " server: " + i.name + " in group: " + group + " is online")
                    break
                else:
                    i.time = time.time()
            else:
                continue
        if not flag:  # 服务组别中没有当前服务实例则新增
            server_status = serverstatus()
            server_status.name = data['name']
            server_status.status = True
            server_status.worker_num = 0
            server_status.time = time.time()
            server_status.group = group
            ServerStatus[server][group].append(server_status)
            print(server + " server: " + server_status.name + " in group: " + group + " is online")
    else:  # 该服务组别为空，无服务实例
        server_status = serverstatus()
        server_status.name = data['name']
        server_status.status = True
        server_status.worker_num = 0
        server_status.time = time.time()
        server_status.group = group
        ServerStatus[server][group].append(server_status)
        print(server + " server: " + server_status.name + " in group: " + group + " is online")
    timer = threading.Timer(6, forbidden_server, (data,))  # 定时6秒后，根据服务实例最后改变时间来更改该服务实例的状态
    timer.start()
    return '200'


def forbidden_server(data):
    group = data['group']
    server = data['server']
    # print(server + " server: " + data['name'] + " in group: " + group + " is checking")
    for i in range(len(ServerStatus[server][group])):
        if ServerStatus[server][group][i].name == data['name']:
            # print(data['name'] + ': ' ,ServerStatus[server][group][i].time)
            # print(data['name'] + ' now : ' , time.time())
            # 如果当前时间和此服务实例之间的时间小于2秒（即此服务实例的时间已被再次更新）
            if time.time() - ServerStatus[server][group][i].time < 2:
                break
            ServerStatus[server][group][i].status = False
            ServerStatus[server][group][i].pid = None
            print(server + " server: " + ServerStatus[server][group][i].name + " in group: " + group + " is offline")
            break
        else:
            continue


# 根据服务名称和组别选择最优的服务实例
def select_server(server, group):
    worker_num = 10000
    name_temp = None
    flag = None
    # print(ServerStatus)
    if 'all' in ServerStatus[server]:
        group = 'all'
    if group not in ServerStatus[server]:  # 无组别
        return None, None
    if len(ServerStatus[server][group]) == 0:  # 组别中无服务实例
        return None, None
    # 找到服务实例中工作数量最少的实例
    for i in range(len(ServerStatus[server][group])):
        if ServerStatus[server][group][i].status:
            if ServerStatus[server][group][i].worker_num < worker_num:
                worker_num = ServerStatus[server][group][i].worker_num
                name_temp = ServerStatus[server][group][i].name
                flag = i
    if flag is not None:
        ServerStatus[server][group][flag].worker_num += 1  # 增加工作数量
    if name_temp is None or flag is None:
        print('no server running')
        return None, None
    else:
        rpc_server = eval("ServerDict['rpc_'+name_temp]" + '.' + name_temp)  # 获取ServerDict中对应的服务实例连接池
        return rpc_server, flag


# 释放服务实例连接
def release_server(server, group, flag):
    if 'all' in ServerStatus[server]:
        group = 'all'
    ServerStatus[server][group][flag].worker_num -= 1  # 工作数量-1


# 网页控制删除服务实例
@app.route('/delete_server', methods=['POST'])
@login_required
def delete_server():
    data = json.loads(request.get_data(as_text=True))
    if 'group' not in data.keys():
        group = request.remote_addr  # group by ip
    else:
        group = data['group']
    server = data['server']
    num = 0
    pid = None
    name = None
    if server not in ServerStatus.keys():
        return json.dumps({"status": 2, "message": "无对应服务:" + server})
    if group in ServerStatus[server].keys():
        if len(ServerStatus[server][group]) > 0:
            for i in ServerStatus[server][group]:
                if i.status and i.pid is None:
                    num += 1
                else:
                    if i.status:
                        if i.pid is not None:
                            pid = i.pid
                            name = i.name
                        else:
                            num += 1
    else:
        return json.dumps({"status": 3, "message": "微服务没该组别: " + group})
    if num > 0:
        pid, name = get_server_pid(server, group)  # 获取服务的pid，用于删除服务实例
    if pid is not None and name is not None:
        try:
            if plat == 'windows':
                os.popen('tskill ' + str(pid))
            elif plat == 'linux':
                os.killpg(pid, signal.SIGKILL)
            for i in ServerStatus[server][group]:
                if i.name == name and i.pid == pid:
                    i.status = False
                    i.pid = None
                    print(data['server'] + " server: " + i.name + " in group: " + group + " is killed")
                    # print(ServerDict)
                    ServerDict.pop('rpc_' + i.name)
                    # print(ServerDict)
            return json.dumps({"status": 0, "message": "删除成功"})
        except:
            print("there is no " + server + " server" + " in group: " + group)
            return json.dumps({"status": 1, "message": "删除失败，请稍后重试"})
    else:
        return json.dumps({"status": 2, "message": "无对应服务"})


# 获取服务的pid
def get_server_pid(server, group):
    # command = "gnome-terminal -x bash -c \"ps -eo pid,cmd|grep \'nameko run " + server + "\'" + ";" + "\""
    if plat == 'windows':
        command = "wmic process get processid,CommandLine | findstr /b \"nameko run\"" + "| findstr \"" + server + "\""
    elif plat == 'linux':
        command = "ps -eo pid,cmd|grep \'nameko run " + server + "\'"
    p = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE)
    output = p.stdout.read().splitlines()
    pid = None
    name = None
    for i in ServerStatus[server][group]:
        if i.status:
            for line in output:
                line = str(line, encoding="utf8")
                if plat == 'windows':
                    if len(line.split()) > 0 and i.name in line:
                        i.pid = int(line.split()[-1])
                        pid = i.pid
                        name = i.name
                elif plat == 'linux':
                    if 'bash -c' in line and i.name in line:
                        i.pid = int(line.split()[0])
                        # print(i.name + ": " + str(i.pid))
                        pid = i.pid
                        name = i.name
    return pid, name


# 网页控制增加服务实例
@app.route('/add_server', methods=['POST'])
@login_required
def add_server():
    data = json.loads(request.get_data(as_text=True))
    if 'group' not in data.keys():
        group = request.remote_addr  # group by ip
    else:
        group = data['group']
    server = data['server']
    num = 0
    if group in ServerStatus[server].keys():
        if len(ServerStatus[server][group]) > 0:
            for i in ServerStatus[server][group]:
                if i.status:
                    num += 1
    print(server + " in group: " + group + " has " + str(num) + " server")
    path = "./config/" + server + "Name.yaml"
    config_dict = yaml.load(open(path, "r").read(), Loader=yaml.Loader)
    Num = 0
    if group in config_dict['ServerGroup']:
        Num = config_dict['ServerGroup'].index(group)
        config_dict['CurrentServerGroupNum'] = Num
        config_dict['TotalNum'] += 1
        config_dict['Server'][Num].append(server + str(config_dict['TotalNum']))
        config_dict['CurrentServerNum'] = len(config_dict['Server'][Num]) - 1
    else:
        config_dict['TotalNum'] += 1
        config_dict['Server'].append([server + str(config_dict['TotalNum'])])
        config_dict['ServerGroup'].append(group)
        config_dict['CurrentServerGroupNum'] = len(config_dict['ServerGroup']) - 1
        Num = config_dict['CurrentServerGroupNum']
        config_dict['CurrentServerNum'] = 0
    with open(path, "w", encoding="utf-8") as f:
        yaml.dump(config_dict, f, Dumper=yaml.RoundTripDumper)
    print("start " + server + " server: " + config_dict['Server'][Num][-1] + " in group: " + group)
    start_a_new_server(server, config_dict['TotalNum'])
    return json.dumps({"message": "新增微服务成功"})


# 增加一个新的服务实例
def start_a_new_server(server, num):
    path = "./config/" + server + str(num) + ".yaml"
    rpc_exchange = 'rpc_' + server + str(num)
    web_server_address = '0.0.0.0:' + str(3000 + num)
    config_dict = {
        "AMQP_URI": 'pyamqp://guest:guest@localhost',
        "WEB_SERVER_ADDRESS": web_server_address,
        "rpc_exchange": rpc_exchange,
        "max_workers": 1000,
        "parent_calls_tracked": 1000,
        "LOGGING": {
            "version": 1,
            "handlers": {
                "console": {"class": "logging.StreamHandler"}},
            "root": {
                "level": "DEBUG",
                "handlers": ['console']}}
    }
    if not os.path.exists(path):
        os.system(r"touch {}".format(path))
    with open(path, "w", encoding="utf-8") as f:
        yaml.dump(config_dict, f, Dumper=yaml.RoundTripDumper)
    if plat == 'windows':
        command = "start cmd.exe /k " + "\"" + "nameko run " + server + "Server --config ./config/" + server + str(
            num) + ".yaml" + "\""
    elif plat == 'linux':
        command = "gnome-terminal -x bash -c " + "\'" + "nameko run " + server + "Server --config ./config/" + server + str(
            num) + ".yaml;exec bash;" + "\'"
    else:
        return
    p = subprocess.Popen(command, shell=True)
    app.config["NAMEKO_rpc_exchange"] = 'rpc_' + server + str(num)
    temp = FlaskPooledClusterRpcProxy()
    temp.init_app(app)
    ServerDict.update({'rpc_' + server + str(num): temp})
    # print(ServerDict)


# <-----------------------------------|微服务网关|----------------------------------->#
@app.route('/userinfo', methods=['POST'])
@login_required
def call_service_userinfo():
    data = request.form  # json.loads(request.get_data(as_text=True))  # 解析json文件，还原变量
    group = request.remote_addr  # group by ip
    server = data.get("server")
    if server in ["search", "edit", "add", "delete"]:
        # build data
        task_result = None
        t0 = time.time()
        rpc_server, flag = select_server('Userinfo', group)
        if rpc_server is None or flag is None:
            return json.dumps({"status": "False",
                               "message": "请确认IP是否分配对应的服务"})
        while task_result is None and time.time() - t0 <= cfg.time_out:
            try:
                if server == 'search':
                    task_result = rpc_server.search(data)
                elif server == 'edit':
                    task_result = rpc_server.edit(data)
                elif server == 'add':
                    task_result = rpc_server.add(data)
                else:
                    task_result = rpc_server.delete(data)
            except:
                break
            else:
                continue
        if task_result is None:
            result = json.dumps({"status": "False",
                                 "message": "响应超时"})
        else:
            print(task_result)
            result = json.dumps({"status": "True",
                                 "message": task_result})
        release_server('Userinfo', group, flag)
    else:
        result = json.dumps({"status": "False",
                             "message": "该接口不存在此Server"})
    return result


@app.route('/test', methods=['POST'])
def call_service_test():
    data = json.loads(request.get_data(as_text=True))  # 解析json文件，还原变量
    group = request.remote_addr  # group by ip
    task_id = uuid.uuid1()
    server = data["server"]
    data["task_id"] = task_id
    if server in ["server1", "server2"]:
        # build data
        task_result = None
        t0 = time.time()
        rpc_server, flag = select_server('Test', group)
        if rpc_server is None or flag is None:
            return json.dumps({"status": "False",
                               "message": "请确认IP是否分配对应的服务"})
        while task_result is None and time.time() - t0 <= cfg.time_out:
            try:
                if server == 'server1':
                    task_result = rpc_server.server1(data)
                else:
                    task_result = rpc_server.server2(data)
            except:
                break
            else:
                continue
        if task_result is None:
            result = json.dumps({"status": "False",
                                 "message": "响应超时"})
        else:
            result = json.dumps({"status": "True",
                                 "message": task_result})
        release_server('Test', group, flag)
    else:
        result = json.dumps({"status": "False",
                             "message": "该接口不存在此Server"})
    return result


# <-----------------------------------|系统启动和结束操作|----------------------------------->#
# 在程序被正常关闭后执行的操作
def after_exit():
    if plat == 'windows':
        command = "wmic process get processid, CommandLine | findstr /b \"nameko run\""
    elif plat == 'linux':
        command = "ps -eo pid,cmd|grep \'nameko run\'"
    else:
        return
    p = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE)
    for line in p.stdout.read().splitlines():
        try:
            if plat == 'windows':
                pid = int(line.split()[-1])
                os.popen('tskill ' + str(pid))
            elif plat == 'linux':
                pid = int(line.split()[0])
                os.killpg(pid, signal.SIGKILL)
        except:
            continue


# 启动微服务的操作函数
def start(ServerName, ServerPort):
    ServerFlieName = ServerName+'Server'
    Serverinfo = eval("cfg." + ServerFlieName)
    temp = dict()
    for key in eval("cfg." + ServerFlieName + ".keys()"):  # cfg.TestServer：{"222.20.77.55": 1}，key即分组信息
        temp.update({key: []})
    ServerStatus.update({ServerName: temp})
    AddServer = Serverinfo
    AddServerName = []
    AddServerNum = 0

    # 写入服务实例启动后需要读取的配置文件，用于确认服务的名称和组别
    for server_group in AddServer.keys():
        Num = AddServer[server_group]
        for i in range(1, Num + 1):
            AddServerName.append(ServerName + str(i + AddServerNum))
        AddServerNum += Num
        path = "./config/" + ServerName + "Name.yaml"
        config_dict = {'Server': [], 'ServerGroup': [], 'CurrentServerGroupNum': 0, 'CurrentServerNum': 0,
                       'totalNum': 0}
        config_dict['Server'].append(AddServerName)
        config_dict['ServerGroup'].append(server_group)
        config_dict['TotalNum'] = AddServerNum

        if not os.path.exists("./config/"):
            os.makedirs("./config/")
        if not os.path.exists(path):
            os.system(r"touch {}".format(path))
        with open(path, "w", encoding="utf-8") as f:
            yaml.dump(config_dict, f, Dumper=yaml.RoundTripDumper)

    # 写入服务启动时的配置文件，用于确定服务交换节点名称，服务地址等
    for i in range(1, AddServerNum + 1):
        path = "./config/" + ServerName + str(i) + ".yaml"
        rpc_exchange = 'rpc_' + ServerName + str(i)
        web_server_address = '0.0.0.0:' + str(ServerPort + i)
        config_dict = {
            "AMQP_URI": 'pyamqp://guest:guest@localhost',
            "WEB_SERVER_ADDRESS": web_server_address,
            "rpc_exchange": rpc_exchange,
            "max_workers": 1000,
            "parent_calls_tracked": 10,
            "LOGGING": {
                "version": 1,
                "handlers": {
                    "console": {"class": "logging.StreamHandler"}},
                "root": {
                    "level": "DEBUG",
                    "handlers": ['console']}}
        }
        if not os.path.exists(path):
            os.system(r"touch {}".format(path))
        with open(path, "w", encoding="utf-8") as f:
            yaml.dump(config_dict, f, Dumper=yaml.RoundTripDumper)
        if plat == 'windows':
            command = "start cmd.exe /k " + "\"" + "nameko run " + ServerFlieName + " --config ./config/" + ServerName + str(
                i) + ".yaml" + "\""
        elif plat == 'linux':
            command = "gnome-terminal -x bash -c " + "\'" + "nameko run " + ServerFlieName + " --config ./config/" + ServerName + str(
                i) + ".yaml;exec bash;" + "\'"
        else:
            return
        p = subprocess.Popen(command, shell=True)
        app.config["NAMEKO_rpc_exchange"] = 'rpc_' + ServerName + str(i)  # 生成对应的RPC连接池，存入ServerDict
        temp = FlaskPooledClusterRpcProxy()
        temp.init_app(app)
        ServerDict.update({'rpc_' + ServerName + str(i): temp})
        time.sleep(0.2)  # 保证读写不冲突


# 启动
def set_up():
    server_list = ['Userinfo']
    for server in server_list:
        start(server, 4000)


if __name__ == '__main__':
    atexit.register(after_exit)
    timer = threading.Timer(1, set_up)
    timer.start()
    port = 8009
    http_server = WSGIServer(('0.0.0.0', port), app)
    http_server.serve_forever()
