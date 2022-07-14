import json
import os

default = {
    "UserinfoServer": {"all": 1},
    "time_out": 0.5,  # 超时时间/s
    "userinfo_database_path": "person.db"
}

cfg_path = "config.json"


class Config:
    def __init__(self, path=cfg_path):
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                bytes = f.read()
            cfg_dict = json.loads(bytes)
        else:
            cfg_dict = default
        self.set_from_dict(cfg_dict)

    def set_from_dict(self, cfg_dict):
        for key in cfg_dict.keys():
            exec('self.'+key+'=cfg_dict[\''+key+'\']')


if __name__ == "__main__":
    cfg = Config()
    print("ok")
