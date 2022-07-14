from __future__ import absolute_import, unicode_literals

import re

import six
from flask import g
from nameko.standalone.rpc import ClusterRpcProxy

from .connection_pool import ConnectionPool
from .errors import (
    BadConfigurationError,
    ClusterNotConfiguredError
)


class PooledClusterRpcProxy(object):
    _pool = None
    _config = None

    def __init__(self, config=None):
        if config:
            self.configure(config)

    def configure(self, config):
        if not config.get('AMQP_URI'):
            raise BadConfigurationError(
                "Please provide a valid configuration.")

        self._config = config
        self._pool = ConnectionPool(
            self._get_nameko_connection,
            initial_connections=config.get('INITIAL_CONNECTIONS', 2),
            max_connections=config.get('MAX_CONNECTIONS', 8),
            recycle=config.get('POOL_RECYCLE')
        )

    def _get_nameko_connection(self):
        # print('self._config:',self._config)
        proxy = ClusterRpcProxy(
            self._config,
            timeout=self._config.get('RPC_TIMEOUT', None)
        )
        return proxy.start()

    def get_connection(self):
        if not self._pool:
            raise ClusterNotConfiguredError(
                "Please configure your cluster beore requesting a connection.")
        return self._pool.get_connection()

    def release_connection(self, connection):
        return self._pool.release_connection(connection)


class LazyServiceProxy(object):
    def __init__(self, get_connection, service):
        self.get_connection = get_connection
        self.service = service

    def __getattr__(self, name):
        return getattr(getattr(self.get_connection(), self.service), name)


class FlaskPooledClusterRpcProxy(PooledClusterRpcProxy):

    def __init__(self, app=None, connect_on_method_call=True):
        super().__init__()
        self._connect_on_method_call = connect_on_method_call
        self.name = None
        if app:
            self.init_app(app)

    def init_app(self, app):
        config = dict()
        for key, val in six.iteritems(app.config):
            match = re.match(r"NAMEKO\_(?P<name>.*)", key)
            if match:
                config[match.group('name')] = val
        self.configure(config)

        self._connect_on_method_call = config.get(
            'NAMEKO_CONNECT_ON_METHOD_CALL',
            self._connect_on_method_call
        )

        app.teardown_appcontext(self._teardown_nameko_connection)

    '''
    def get_connection(self):
        connection = getattr(g, '_nameko_connection', None)  # '_nameko_connection'
        # print('get_connection,connection:',connection)
        if not connection:
            connection = super(
                FlaskPooledClusterRpcProxy, self).get_connection()  # use PooledClusterRpcProxy get_connection()
            g._nameko_connection = connection
        # print('get_connection,connection1:', connection)
        return connection
    '''

    def get_connection_(self, name):
        nameko = getattr(g, 'nameko', dict({}))  # '_nameko_connection'
        self.name = name
        if name in nameko.keys():
            connection = nameko[name]
        else:
            connection = None
        # print('get_connection,connection:',connection)
        if not connection:
            connection = self.get_connection()  # use PooledClusterRpcProxy get_connection()
            if g.get('nameko', None) is None:
                g.nameko = dict()
            g.nameko.update({name: connection})
        # print('get_connection,connection1:', connection)
        # print(g.nameko)
        return connection

    def _teardown_nameko_connection(self, exception):
        connections = getattr(g, 'nameko', dict())
        # print('_teardown_nameko_connection,connection:', connection)
        if self.name in connections.keys():
            connection = connections[self.name]
            if connection is not None:
                # print('name',self.name)
                # print('release_connection', connection)
                self.release_connection(connection)

    def _get_service(self, service):
        # print('service:',service)
        if self._connect_on_method_call:
            return LazyServiceProxy(lambda: self.get_connection_(service), service)
        else:
            return getattr(lambda: self.get_connection_(service), service)

    def __getattr__(self, name):
        return self._get_service(name)

    def __getitem__(self, name):
        return self._get_service(name)
