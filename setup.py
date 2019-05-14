from setuptools import setup


# extract version from __init__.py
with open('openpifpafwebdemo/__init__.py', 'r') as f:
    VERSION_LINE = [l for l in f if l.startswith('__version__')][0]
    VERSION = VERSION_LINE.split('=')[1].strip()[1:-1]


setup(
    name='openpifpafwebdemo',
    version=VERSION,
    packages=[
        'openpifpafwebdemo',
    ],
    license='MIT',
    description='Web-browser demo for openpifpaf.',
    long_description=open('README.md').read(),
    long_description_content_type='text/markdown',
    author='Sven Kreiss',
    author_email='research@svenkreiss.com',
    url='https://github.com/vita-epfl/openpifpafwebdemo',
    include_package_data=True,

    install_requires=[
        'openpifpaf>=0.6.1',
        'tornado>=6',
    ],
    extras_require={
        'test': [
            'pylint',
            'pytest',
        ],
    },
)
