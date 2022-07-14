import time
from nameko.rpc import rpc
from nameko.timer import timer
import datetime
import requests
import json
import cv2
import base64
import numpy as np
from ruamel import yaml
from config import *
from PersonDatabaseOperation import PersonDatabaseDependency

cfg = Config()


def get_server_name_and_group(path):
    config_dict = yaml.load(open(path, "r").read(), Loader=yaml.Loader)
    CurrentServerGroupNum = config_dict['CurrentServerGroupNum']
    CurrentServerNum = config_dict['CurrentServerNum']
    CurrentServerGroup = config_dict['ServerGroup'][CurrentServerGroupNum]
    print(config_dict)
    ServerName = config_dict['Server'][CurrentServerGroupNum][CurrentServerNum]
    config_dict['CurrentServerNum'] += 1
    if config_dict['CurrentServerNum'] == len(config_dict['Server'][CurrentServerGroupNum]):
        config_dict['CurrentServerNum'] = 0
        config_dict['CurrentServerGroupNum'] += 1
    with open(path, "w", encoding="utf-8") as f:
        yaml.dump(config_dict, f, Dumper=yaml.RoundTripDumper)
    return ServerName, CurrentServerGroup


class UserinfoServer():
    name, group = get_server_name_and_group(path="./config/UserinfoName.yaml")
    sid = "1"
    database_dependency = PersonDatabaseDependency(cfg.userinfo_database_path)
    remote_ip = 'http://127.0.0.1:8009'
    session = requests.session()
    data = {"server": "Userinfo", "group": group, "name": name}
    try:
        session.post(url=remote_ip + '/heartbeat', data=json.dumps(data))
    except:
        print('can not connect to WebManage')

    @timer(interval=5)
    def heartbeat(self):
        data = {"server": "Userinfo", "group": self.group, "name": self.name}
        try:
            self.session.post(url=self.remote_ip + '/heartbeat', data=json.dumps(data), timeout=1)
        except:
            print('can not connect to WebManage')

    @rpc
    def search(self, data):
        print(datetime.datetime.now(), "[Userinfo]", "查询人员信息")
        task_result = dict()
        # print(data)
        result, sum = self.database_dependency.query_user_by_condition(data)
        task_result.update({'result': result, 'sum': sum})
        return task_result

    @rpc
    def edit(self, data):
        print(datetime.datetime.now(), "[Userinfo]", "编辑人员信息")
        task_result = dict()
        id = data.get('id')
        name = data.get('name')
        username = data.get('username')
        type = data.get('usertype')
        self.database_dependency.edit_user(id, name, username, type)
        task_result.update({'status': 1})
        return task_result

    @rpc
    def add(self, data):
        print(datetime.datetime.now(), "[Userinfo]", "增加人员信息")
        task_result = dict()
        name = data.get('name')
        username = data.get('username')
        password = data.get('password')
        type = data.get('usertype')
        self.database_dependency.add_user(name, username, password, type)
        task_result.update({'status': 1})
        return task_result

    @rpc
    def delete(self, data):
        print(datetime.datetime.now(), "[Userinfo]", "删除人员信息")
        task_result = dict()
        self.database_dependency.delete_user(data.get('id'))
        task_result.update({'status': 1})
        return task_result
