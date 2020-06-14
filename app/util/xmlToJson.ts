import { parseString } from 'xml2js';
import { Message } from '../controller/schema';

interface XMLObject {
  xml: Message;
}

export function xmlToJson(xml: string): Promise<XMLObject> {
  return new Promise((resolve, reject) => {
    parseString(xml, { explicitArray: false }, (err, result: XMLObject) => {
      if (err) {
        reject(err);
      }
      return resolve(result);
    });
  });

}
