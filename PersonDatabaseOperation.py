import sqlite3
import os
from dbutils.persistent_db import PersistentDB
from nameko.dependency_providers import DependencyProvider
import datetime

'''
实测证明 PersistentDB 的速度是最高的，但是在某些特殊情况下，数据库的连接过程可能异常缓慢，而此时的PooledDB则可以提供相对来说平均连接时间比较短的管理方式。
另外，实际使用的数据库驱动也有所依赖，比如SQLite数据库只能使用PersistentDB作连接池
'''


class PersonDatabaseDependency(DependencyProvider):
    def __init__(self, path):  # '../conn/person.db'
        self.database_path = path
        # print("初始化数据库")

    def setup(self):
        print(datetime.datetime.now(), "[SQLite]", "SQLiteDependency已启动")
        self.pool = PersistentDB(creator=sqlite3, maxusage=5, database=self.database_path)  # 10为连接池里的最少连接数
        # print("SQLiteDependency已创建数据库连接池")

    def get_dependency(self, worker_ctx):
        # print(worker_ctx)
        # print(worker_ctx.service_name, "启用了一个数据库连接")
        return PersonDatabaseOperation(self.pool.connection())


class PersonDatabaseOperation:
    def __init__(self, conn):
        self.conn = conn
        self.cur = conn.cursor()

    def add_user(self, name, username, password, type):
        self.cur.execute(
            "INSERT INTO person_info (person_name,username,password,type,valid) VALUES ('{}', '{}', '{}',{},1)".format(
                name,
                username,
                password, type))
        self.conn.commit()
        # self.conn.close()

    def delete_user(self, id):
        self.cur.execute("UPDATE person_info set valid = 0 where person_id = {}".format(id))
        self.conn.commit()
        # self.conn.close()

    def edit_user(self, id, name, username, type):
        self.cur.execute(
            "UPDATE person_info set person_name = '{}',username = '{}',type = {} where person_id = {}".format(name,
                                                                                                              username,
                                                                                                              type, id))
        self.conn.commit()
        # self.conn.close()

    def query_user_by_condition(self, data):
        # print(data)
        sql_str_sum = "SELECT count(*)'sum' FROM person_info"
        sql_str = "SELECT person_id,person_name,username,type from person_info"
        id = data.get("id") if data.get("id") is not None else ''
        name = data.get("name") if data.get("name") is not None else ''
        username = data.get("username") if data.get("username") is not None else ''
        usertype = data.get("usertype") if data.get("usertype") is not None else ''
        num_of_pages = int(data.get("num_of_pages")) - 1
        flag = False
        sql_condition = ''
        if len(id) > 0:
            if not flag:
                sql_condition += " where person_id = {}".format(int(id))
            else:
                sql_condition += " and person_id = {}".format(int(id))
            flag = True
        if len(name) > 0:
            if not flag:
                sql_condition += " where person_name like '%{}%'".format(name)
            else:
                sql_condition += " and person_name like '%{}%'".format(name)
            flag = True
        if len(username) > 0:
            if not flag:
                sql_condition += " where username like '%{}%'".format(username)
            else:
                sql_condition += " and username like '%{}%'".format(username)
            flag = True
        if len(usertype) > 0:
            if not flag:
                if len(usertype.split(',')) == 1:
                    if int(usertype) == 3:
                        sql_condition += " where type > {}".format(-1)
                    else:
                        sql_condition += " where type = {}".format(usertype)
                else:
                    sql_condition += " where type in ({})".format(usertype)
            else:
                if len(usertype.split(',')) == 1:
                    if int(usertype) == 3:
                        sql_condition += " and type > {}".format(-1)
                    else:
                        sql_condition += " and type = {}".format(usertype)
                else:
                    sql_condition += " and type in ({})".format(usertype)
            flag = True
        if not flag:
            sql_condition += ' where valid = 1'
        else:
            sql_condition += ' and valid = 1'
        sql_str += sql_condition + " order by person_id limit 10 offset {}".format(10 * num_of_pages)
        # print(sql_str)
        result = self.cur.execute(sql_str).fetchall()
        sql_str_sum += sql_condition  # + " order by person_id"
        sum = self.cur.execute(sql_str_sum).fetchall()
        self.conn.commit()
        return result, sum