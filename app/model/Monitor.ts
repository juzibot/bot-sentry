module.exports = (app: any) => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const MonitorSchema = new Schema({
    company: { type: String },
    tokenNum: { type: Number },
    stopTokenNum: { type: Number },
    removeTokenNum: { type: Number },
    missTokenNum: { type: Number },
    deadTokenNum: { type: Number },
    detailInfo: {
      type: {
        userTokenList: String,
        tokenDockerMap: String,
      },
    },
  }, {
    toJson: { virtuals: true },
    timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' },
  });

  return mongoose.model('Monitor', MonitorSchema, 'monitor');
};
