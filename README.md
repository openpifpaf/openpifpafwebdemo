# openpifpafwebdemo

![Tests](https://github.com/openpifpaf/openpifpafwebdemo/workflows/Tests/badge.svg)

Links:
[main repository](https://github.com/openpifpaf/openpifpaf),
[2021 paper](https://arxiv.org/abs/2103.02440) and
[CVPR2019 paper](http://openaccess.thecvf.com/content_CVPR_2019/html/Kreiss_PifPaf_Composite_Fields_for_Human_Pose_Estimation_CVPR_2019_paper.html).<br />
Live demo: https://vitademo.epfl.ch<br />
Serverless live demo: https://openpifpaf.github.io/openpifpafwebdemo/


# Use Locally

Run the full pipeline (neural network and decoder) in Python
and visualize the output in the browser:

```sh
pip3 install openpifpafwebdemo
python3 -m openpifpafwebdemo.server
```

_Troubleshooting_: Make sure you are using Python3 and have the latest pip and
setuptools with `pip install --upgrade pip setuptools`. Do not clone this
repository. Make sure there is no folder named `openpifpafwebdemo` in your
current directory.


__Example:__

<img src="https://github.com/openpifpaf/openpifpafwebdemo/blob/main/docs/wave3.gif" height=250 alt="example image" />


# Docker

For every release, this repository builds a new docker image and uploads it
to [Docker Hub: svenkreiss/openpifpafwebdemo](https://hub.docker.com/r/svenkreiss/openpifpafwebdemo).
You can test it with:

```
docker run -d -p 5000:80 svenkreiss/openpifpafwebdemo
```

This docker images also powers https://vitademo.epfl.ch. More info on building
the docker image and how to deploy it to Kubernetes is in [docker/readme.md](docker/readme.md).


# API

Example using cURL:

```sh
curl --data-binary @docs/me_nyc_square_500.jpeg http://localhost:5000/v1/human-poses
```

which produces:

```json
[{"coordinates": [[0.588631883263588, 0.41628291457891464, 3.5567557387194797], [0.621234196703881, 0.36160339042544365, 3.524825929280572], [0.546875, 0.375, 3.744302039019678], [0.6724068783223629, 0.44710323959589005, 3.459401266884038], [0.494683139026165, 0.4611567258834839, 3.5954212359489217], [0.78733691573143, 0.8311769068241119, 2.1321910543190827], [0.3859005756676197, 0.8252473473548889, 2.158424186304439], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]], "score": 0.26909651332876167}]
```

Keep-alive connection test:

```sh
curl -v --data-binary @docs/me_nyc_square_500.jpeg http://localhost:5000/v1/human-poses --next --data-binary @docs/me_nyc_square_500.jpeg http://localhost:5000/v1/human-poses 2>&1 | grep '#0'
* Connected to localhost (127.0.0.1) port 5000 (#0)
* Connection #0 to host localhost left intact
* Re-using existing connection! (#0) with host localhost
* Connected to localhost (127.0.0.1) port 5000 (#0)
* Connection #0 to host localhost left intact
```


# Dev

To install from source and set up for development use
`pip install --editable ".[test]"`, install the frontend dependencies with
`npm install` and then create the frontend JavaScript code with `npm run build`. For continuous rebuilds of the js package, use `npm run watch`.

Run the server process with `--debug` to get salted version numbers to break
the browser cache for static assets and autoreload when source files change.


# Citation

```
@article{kreiss2021openpifpaf,
  title = {{OpenPifPaf: Composite Fields for Semantic Keypoint Detection and Spatio-Temporal Association}},
  author = {Sven Kreiss and Lorenzo Bertoni and Alexandre Alahi},
  journal = {arXiv preprint arXiv:2103.02440},
  month = {March},
  year = {2021}
}

@InProceedings{kreiss2019pifpaf,
  author = {Kreiss, Sven and Bertoni, Lorenzo and Alahi, Alexandre},
  title = {PifPaf: Composite Fields for Human Pose Estimation},
  booktitle = {The IEEE Conference on Computer Vision and Pattern Recognition (CVPR)},
  month = {June},
  year = {2019}
}
```
