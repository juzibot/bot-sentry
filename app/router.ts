import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router } = app;

  router.get('/', controller.message.check);
  router.post('/', controller.message.receiveMessage);

  /**
   * Privatization deployment monitor
   */

  router.post('/deploy/summary', controller.monitor.collector);
};
