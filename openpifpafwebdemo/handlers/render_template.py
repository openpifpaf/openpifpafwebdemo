import tornado


class RenderTemplate(tornado.web.RequestHandler):
    def initialize(self, template_name, **info):
        self.template_name = template_name  # pylint: disable=attribute-defined-outside-init
        self.info = info  # pylint: disable=attribute-defined-outside-init

    def get(self):
        self.render(self.template_name, **self.info)

    def head(self):
        pass
