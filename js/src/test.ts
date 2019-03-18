import * as child_process from 'child_process';
import { expect } from 'chai';
import * as request from 'request';
import * as fs from 'fs';


describe('Server Process', () => {
  let databench_process_return_code = -42;
  let envVars = process.env;
  envVars.PORT = '5002';
  const databench_process = child_process.spawn('python', [
    '-m', 'openpifpafwebdemo.server',
  ], {
      env: envVars,
  });
  expect(databench_process).to.not.equal(null);
  expect(databench_process.stdout).to.not.equal(null);
  if (databench_process.stdout == null) return;
  if (databench_process.stderr == null) return;
  databench_process.stdout.on('data', data => console.log('databench stdout: ' + data));
  databench_process.stderr.on('data', data => console.log('databench stderr: ' + data));
  databench_process.on('exit', code => {
    if (code == null) code = -100;
    databench_process_return_code = code;
    console.log('databench process exited with code ' + code);
  });

  before(done => {
    setTimeout(() => {
      expect(databench_process_return_code).to.equal(-42);
      done();
    }, 2000);
  });

  after(done => {
    setTimeout(() => {
      databench_process.kill('SIGINT');
      done();
    }, 2000);
  });

  describe('web interface', () => {
    it('has a working front end page', done => {
      request.get('http://localhost:5002', (error, response, body) => {
        expect(response.statusCode).to.equal(200);
        done();
      });
    });

    it('serves the javascript files', done => {
      request.get('http://localhost:5002/analysis.js', (error, response, body) => {
        expect(response.statusCode).to.equal(200);
        done();
      });
    });

    it('can respond to post requests with images', done => {
      const testImage = fs.readFileSync('test_image.json').toString();
      request.post({
        url: 'http://localhost:5002/process',
        formData: JSON.parse(testImage),
      }, (error, response, body) => {
        expect(response.statusCode).to.equal(200);

        const data = JSON.parse(body);
        const scores = data.map((entry: any) => entry.score);
        console.log({scores});

        expect(scores.length).to.equal(1);
        expect(scores[0]).greaterThan(0.2);
        done();
      });
    });
  });
});
