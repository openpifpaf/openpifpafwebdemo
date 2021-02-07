FROM pytorch/pytorch:1.7.1-cuda11.0-cudnn8-runtime

COPY dist/openpifpafwebdemo-latest.tar.gz .
RUN pip install openpifpafwebdemo-latest.tar.gz

EXPOSE 80
CMD [ "python3", "-m", "openpifpafwebdemo.server", "--host=0.0.0.0", "--port=80" ]
