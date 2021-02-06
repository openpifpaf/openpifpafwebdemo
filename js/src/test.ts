import * as child_process from 'child_process';
import { expect } from 'chai';
import fetch from 'node-fetch';
import * as fs from 'fs';


describe('Server Process', () => {
  let server_process_return_code = -42;

  // spawn the server process
  let envVars = process.env;
  envVars.PORT = '5002';
  const server_process = child_process.spawn('python', [
    '-m', 'openpifpafwebdemo.server',
    '--no-download-progress',
  ], {
      env: envVars,
  });

  // configure process
  expect(server_process).to.not.equal(null);
  expect(server_process.stdout).to.not.equal(null);
  if (server_process.stdout == null) return;
  if (server_process.stderr == null) return;
  server_process.stdout.on('data', data => console.log('server stdout: ' + data));
  server_process.stderr.on('data', data => console.log('server stderr: ' + data));
  server_process.on('exit', code => {
    if (code == null) code = -100;
    server_process_return_code = code;
    console.log('server process exited with code ' + code);
  });

  before(done => {
    setTimeout(() => {
      expect(server_process_return_code).to.equal(-42);
      done();
    }, 5000);
  });

  after(done => {
    setTimeout(() => {
      server_process.kill('SIGINT');
      done();
    }, 2000);
  });

  describe('web interface', () => {
    it('has a working front end page', async function() {
      const response = await fetch('http://localhost:5002');
      expect(response.status).to.equal(200);
    });

    it('serves frontend.js', async function() {
      const response = await fetch('http://localhost:5002/static/frontend.js');
      expect(response.status).to.equal(200);
    });
    it('serves clientside.js', async function() {
      const response = await fetch('http://localhost:5002/static/clientside.js');
      expect(response.status).to.equal(200);
    });

    it('can respond to post requests with images', async function() {
      const image = fs.readFileSync('docs/me_nyc_square_500.jpeg');
      const response = await fetch('http://localhost:5002/v1/human-poses', {
          method: 'post',
          body: image,
      });
      expect(response.status).to.equal(200);

      const data = await response.json();
      const scores = data.map((entry: any) => entry.score);

      expect(scores.length).to.equal(1);
      expect(scores[0]).greaterThan(0.2);
    });
  });
});
