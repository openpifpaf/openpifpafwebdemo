Work in progress ...

# Getting Started

Download a pre-trained model from [Google Drive](https://drive.google.com/drive/folders/1v8UNDjZbqeMZY64T33tSDOq1jtcBJBy7). Then:

```sh
pip install -r requirements.txt
python openpifpafwebdemo/web.py --checkpoint resnet50block5-pif-paf-edge401-190225-112156.pkl
```

Open a web browser at `http://localhost:5000` to view the web interface.


# API

Example using cURL:

```sh
curl -X POST -H "Content-Type: application/json" --data @test_image.json http://localhost:5000/process
```

which produces:

```json
[{"coordinates": [[0.588631883263588, 0.41628291457891464, 3.5567557387194797], [0.621234196703881, 0.36160339042544365, 3.524825929280572], [0.546875, 0.375, 3.744302039019678], [0.6724068783223629, 0.44710323959589005, 3.459401266884038], [0.494683139026165, 0.4611567258834839, 3.5954212359489217], [0.78733691573143, 0.8311769068241119, 2.1321910543190827], [0.3859005756676197, 0.8252473473548889, 2.158424186304439], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]], "score": 0.26909651332876167}]
```
