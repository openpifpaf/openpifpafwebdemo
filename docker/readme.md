# Docker Images

Images are being built as part of a release and are publicly available on Docker Hub.


## Building Docker Images Locally

Advanced. If possible, use a pre-built image from Docker Hub instead of
building your own.

```
python setup.py sdist
cp dist/openpifpafwebdemo-<version>.tar.gz dist/openpifpafwebdemo-latest.tar.gz
DOCKER_BUILDKIT=1 docker build -f docker/Dockerfile -t svenkreiss/openpifpafwebdemo .
docker run -d -p 5000:80 svenkreiss/openpifpafwebdemo
```


## Kubernetes / microk8s

I am sharing the configurations that I use for
[vitademo.epfl.ch](https://vitademo.epfl.ch) here. To configure your Kubernetes
cluster:

```
kubectl apply -f ssl_secret_<yourdomain>.yml  # optional
kubectl apply -f service_deployment_echo.yml  # echo test endpoint /echo
kubectl apply -f service_deployment.yml  # remove/modify Google Analytics ID
kubectl apply -f ingress.yml  # adapt for your domain
```


## Troubleshooting: microk8s with GPU

Feb 8, 2021

Nvidia GPU support in microk8s is a mess. Part of this is that the snap
supposedly comes with containerd that clashes with the system containerd (maybe).
Anyway, after many trials, containerd with nvidia seems not supported yet.
Everything becomes a bit more straightforward giving up on containerd and
switching to the docker runtime. Then you can test docker outside of microk8s first.
Make sure you have working GPU support for docker. You might need to modify
`/etc/docker/daemon.json` and add `"default-runtime": "nvidia"`:

```
{
    "default-runtime": "nvidia",
    "runtimes": {
        "nvidia": {
            "path": "nvidia-container-runtime",
            "runtimeArgs": []
        }
    }
}
```

Then you need to make sure microk8s is using the docker backend.
Edit `/var/snap/microk8s/current/args/kubelet` and set:

```
--container-runtime=docker
```

Restart microk8s: `sudo snap restart microk8s`.
Check the container runtime: `microk8s kubectl describe nodes` should say
`Container Runtime Version:  docker://20.10.3`.
From the same `describe nodes` output you can also get the name of the pod
that runs the nvidia-device-plugin support and query its logs:
`microk8s kubectl logs -n kube-system pod/nvidia-device-plugin-daemonset-mqb9z`.
When nothing was working, this had a clear error message.
