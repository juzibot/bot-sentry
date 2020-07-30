import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router } = app;

  router.get('/', controller.message.check);
  router.post('/', controller.message.receiveMessage);
};
