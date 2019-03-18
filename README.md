# openpifpafwebdemo

[![Build Status](https://travis-ci.org/vita-epfl/openpifpafwebdemo.svg?branch=master)](https://travis-ci.org/vita-epfl/openpifpafwebdemo)

> Demo of "PifPaf: Composite Fields for Human Pose Estimation".

Links: [main repository](https://github.com/vita-epfl/openpifpaf), [paper on arXiv](https://arxiv.org/abs/1903.06593).

```
@article{kreiss2019pifpaf,
  title = {PifPaf: Composite Fields for Human Pose Estimation},
  author = {Kreiss, Sven and Bertoni, Lorenzo and Alahi, Alexandre},
  journal = {CVPR},
  year = {2019}
}
```

# Getting Started

```sh
pip install --upgrade pip setuptools  # making sure your Python is up-to-date
pip install cython numpy
pip install openpifpafwebdemo
python -m openpifpafwebdemo.server
```

Open a web browser at `http://localhost:5000` to view the web interface.

__Example__: ResNet-50 on a laptop without GPU acceleration running at 5.1 FPS.

<img src="docs/example.png" height=250 alt="example image" />


To install from source and set up for development use `pip install -e ".[test]"`.


# API

Example using cURL:

```sh
curl -X POST -H "Content-Type: application/json" --data @test_image.json http://localhost:5000/process
```

which produces:

```json
[{"coordinates": [[0.588631883263588, 0.41628291457891464, 3.5567557387194797], [0.621234196703881, 0.36160339042544365, 3.524825929280572], [0.546875, 0.375, 3.744302039019678], [0.6724068783223629, 0.44710323959589005, 3.459401266884038], [0.494683139026165, 0.4611567258834839, 3.5954212359489217], [0.78733691573143, 0.8311769068241119, 2.1321910543190827], [0.3859005756676197, 0.8252473473548889, 2.158424186304439], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]], "score": 0.26909651332876167}]
```
