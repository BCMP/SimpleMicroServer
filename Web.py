from flask import Blueprint, render_template, redirect, request
from flask_login import login_user, login_required

user = Blueprint('user', __name__)

'''
# 返回静态网页
@user.route('/home', methods=['GET', 'POST'])
@login_required
def home():
    username = request.args.get('username')
    return render_template('./road/home.html', username=username)


# 返回静态网页
@user.route('/UserManager', methods=['GET', 'POST'])
@login_required
def UserManager():
    username = request.args.get('username')
    return render_template('./road/UserManager.html', username=username)


# 返回静态网页
@user.route('/ServerManager', methods=['GET', 'POST'])
@login_required
def ServerManager():
    username = request.args.get('username')
    return render_template('./road/ServerManager.html', username=username)


# 返回静态网页
@user.route('/RoadManager', methods=['GET', 'POST'])
@login_required
def RoadManager():
    username = request.args.get('username')
    return render_template('./road/RoadManager.html', username=username)
'''

# 返回静态网页
@user.route('/main', methods=['GET', 'POST'])
@login_required
def MainPage():
    username = request.args.get('username')
    return render_template('./MainPage.html', username=username)


# 返回静态网页
@user.route('/UserManagerSubPage', methods=['GET', 'POST'])
@login_required
def UserManagerSubPage():
    return render_template('./UserManagerSubPage.html')


# 返回静态网页
@user.route('/ServerManagerSubPage', methods=['GET', 'POST'])
@login_required
def ServerManagerSubPage():
    return render_template('./ServerManagerSubPage.html')
