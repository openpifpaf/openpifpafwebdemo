# Docker Images

Images are being built as part of a release and are publicly available on Docker Hub.


## Building Docker Images Locally

```
python setup.py sdist
cp dist/openpifpafwebdemo-<version>.tar.gz dist/openpifpafwebdemo-latest.tar.gz
DOCKER_BUILDKIT=1 docker build -f docker/Dockerfile -t svenkreiss/openpifpafwebdemo .
docker run -d -p 5000:80 svenkreiss/openpifpafwebdemo
```
