
## Brief Introduction
This project will monitor bot login status by interaction with Official Account, there are two requests for the bot:
1. send `botId#ding-start` to OA when the bot start;
2. the bot could auto reply #ding with `botId#dong`;

## Deploy

### step 1
> Set APPID and APPSECRET of Official Account to env
```bash
export APPID='xxx'
export APPSECRET='xxx'
```

### step 2
```bash
$ npm run tsc
$ npm start
```

### Command List
#### public list

- `#ddr`: show all bots' statistics

- `#dead`: show all dead bots

- `botId#info`: search bot info by bot id

#### private list

- `botId#clear`: clear warn number and replace the response time by current time

- `botId#reset`: reset all attributes of cache object

- `botId#del`: delete the bot info
