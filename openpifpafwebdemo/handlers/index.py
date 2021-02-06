import tornado


class Index(tornado.web.RequestHandler):
    def initialize(self, template_name, demo_password, **info):
        self.template_name = template_name
        self.demo_password = demo_password
        self.info = info

    def get(self):
        password = self.get_argument('pw', default=None)
        if self.demo_password and password == self.demo_password:
            self.info['width_height'] = (801, 601)
        elif self.demo_password:
            self.write('Demo currently in progress. Check back later.')
            return
        self.render(self.template_name, **self.info)

    def head(self):
        pass
