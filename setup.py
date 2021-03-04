from setuptools import find_packages, setup
import versioneer


setup(
    name='openpifpafwebdemo',
    version=versioneer.get_version(),
    cmdclass=versioneer.get_cmdclass(),
    packages=find_packages(),
    license='MIT',
    description='Web-browser demo for openpifpaf.',
    long_description=open('README.md').read(),
    long_description_content_type='text/markdown',
    author='Sven Kreiss',
    author_email='research@svenkreiss.com',
    url='https://github.com/vita-epfl/openpifpafwebdemo',
    include_package_data=True,

    install_requires=[
        'openpifpaf>=0.12.5',
        'tornado>=6',
    ],
    extras_require={
        'test': [
            'pycodestyle',
            'pylint',
            'pytest',
        ],
    },
)
