import request from 'supertest';
import app from '../../../app';


describe('/Departments create', () => {
  it('should return a no user found error with wrong email', (done) => {
    request(app)
      .post('/api/v1/departments')
      .send({
        email: 'unKnownEmail@test.com',
        name: 'test',
      })
      .set({
        Accept: 'application/json'
      })
      .expect(404, {
        success: false,
        message: 'User not found'
      }, done);
  });


  it('should respond with a no email provided error', (done) => {
    request(app)
      .post('/api/v1/departments')
      .send({
        name: 'test',
      })
      .set({
        Accept: 'application/json'
      })
      .expect(400, {
        success: false,
        messages: ['Please provide email.'],
      }, done);
  });

  it('should respond with invalid email', (done) => {
    request(app)
      .post('/api/v1/departments')
      .send({
        email: 'alll.com',
        name: 'test',
      })
      .expect(400)
      .end((err, res) => {
        expect(res.body);
        done();
      });
  });

  it('should respond with department cannot contain numeric values', (done) => {
    request(app)
      .post('/api/v1/departments')
      .send({
        email: 'opeoluwa.iyi-kuyoro@andela.com',
        name: '  ',
      })
      .set({
        Accept: 'application/json'
      })
      .expect(400, {
        success: false,
        messages: ['Please provide a valid department name.'],
      }, done);
  });

  it('should respond with department cannot contain numeric values', (done) => {
    request(app)
      .post('/api/v1/departments')
      .send({
        email: 'opeoluwa.iyi-kuyoro@andela.com',
        name: '1111111',
      })
      .set({
        Accept: 'application/json'
      })
      .expect(400, {
        success: false,
        messages: ['Department cannot contain numeric values only.'],
      }, done);
  });

  it('should respond with a no name provided error', (done) => {
    request(app)
      .post('/api/v1/departments')
      .send({
        email: 'test.test@test.com',
      })
      .set({
        Accept: 'application/json'
      })
      .expect(400, {
        success: false,
        messages: ['Please provide name.'],
      }, done);
  });

  it('should respond success', (done) => {
    request(app)
      .post('/api/v1/departments')
      .send({
        email: 'opeoluwa.iyi-kuyoro@andela.com',
        name: 'tembea',
      })
      .set({
        Accept: 'application/json'
      })
      .expect(201, done);
  });

  it('should respond with a department already exists.', (done) => {
    request(app)
      .post('/api/v1/departments')
      .send({
        email: 'opeoluwa.iyi-kuyoro@andela.com',
        name: 'tembea',
      })
      .set({
        Accept: 'application/json'
      })
      .expect(409, {
        success: false,
        message: 'Department already exists.',
      }, done);
  });
});
