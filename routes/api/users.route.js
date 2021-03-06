import express from 'express';
import _ from 'lodash';
import User from '../../models/user';
import {
  NotFoundError,
  BadRequestError
} from '../../utils';

const router = express.Router();

let fields = ['name', 'email', 'password'];

router.get('/', (req, res, next) => {
  // req.knex.select().from('users').then((users) => {
  //   res.send({users});
  // }).catch((e) => next(e));


  User.fetchAll().then((users) => {
    res.send({
      users
    });
  }).catch((e) => next(e));
});

router.get('/:id', (req, res, next) => {
  // req.knex('users').where('id', req.params.id).then((users) => {
  //   let user = users[0];
  //   delete user.password;
  //   res.send({
  //     user
  //   });
  // }).catch((e) => next(e));
  // User.forge({id: req.params.id}).fetch().then((user) => {
  //   res.send({user});
  // }).catch((e) => next(e));

  res.send({
    user: req.user
  });
});

router.post('/', (req, res, next) => {
  let body = _.pick(req.body, fields);
  let rules = {
    name: {
      required: true,
      minlength: 2,
      maxlength: 10,
      unique: User,
    },
    email: {
      required: true,
      email: true,
      maxlength: 100,
      unique: User,
    },
    password: {
      required: true,
      minlength: 6,
      maxlength: 10,
    },
  };

  req.validator.validate(body, rules).then(() => {
    return User.forge(body).save().then((user) => {
      return user.hashPassword().then(() => {
        return user.generateAuthToken().then((token) => {
          res.header('x-auth', token).status(201).send({
            user
          });
        });
      });
    });
  }).catch((e) => next(e));
});

router.patch('/:id', (req, res, next) => {
  let body = _.pick(req.body, fields);

  // User.forge({id: req.params.id}).fetch({require: true}).then((user) => {
  //   return user.save(body).then(() => {
  //     res.send({user});
  //   });
  // }).catch((e) => next(e));

  let rules = {
    name: {
      // required: true,
      minlength: 2,
      maxlength: 10,
      unique: {
        model: User,
        value: req.user.toJSON().name
      },
    },
    email: {
      email: true,
      maxlength: 100,
      unique: {
        model: User,
        value: req.user.toJSON().email
      },
    },
    password: {
      minlength: 6,
      maxlength: 10,
    },
  };

  req.validator.validate(body, rules).then(() => {
    return req.user.save(body).then(() => {
      res.send({
        user: req.user
      });
    });
  }).catch((e) => res.status(400).send(e));
});

router.delete('/:id', (req, res, next) => {
  // req.knex('users').where('id', req.params.id).del().then(() => {
  //   return req.knex('users').select().then((users) => {
  //     res.send({
  //       users
  //     });
  //   });
  // }).catch((e) => next(e));
  // User.forge({id: req.params.id}).fetch({require: true}).then((user) => {
  //   return user.destroy().then(() => {
  //     res.send({user});
  //   });
  // }).catch((e) => next(e));
  req.user.destroy().then(() => {
    return User.fetchAll().then((users) => {
      res.send({
        users
      });
    });
  }).catch((e) => next(e));
});

router.param('id', (req, res, next, id) => {
  if (isNaN(id)) {
    let error = new BadRequestError(req.__('error.bad request'));
    return next(error);
  }
  User.forge({
    id
  }).fetch().then((user) => {
    if (user === null) {
      let error = new NotFoundError(req.__('error.user not found'));
      return next(error);
    }
    req.user = user;
    next();
  });
});

export default router;
