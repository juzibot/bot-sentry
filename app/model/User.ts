module.exports = (app: any) => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const UserSchema = new Schema({
    seq: { type: Number, unique: true }, // 序号
    createTime: { type: Date, default: Date.now },
    updateTime: { type: Date, default: Date.now },
    tokens: { type: [{
      token: { type: String, required: true },
      createTime: { type: Date, default: Date.now },
      updateTime: { type: Date, default: Date.now },
      expireTime: { type: Date, default: Date.now },
      type: { type: Number, default: 0 },
      online: { type: Boolean, default: false },
      memo: { type: String, default: '' },
      remark: { type: String, default: '' },
    }], default: [] },
    discount: { type: Number, required: true, unique: false }, // 折扣信息
    password: { type: String, required: false, unique: false }, // 密码
    email: { type: String, required: false, unique: false }, // 邮箱
    company: { type: String, required: false, unique: false }, // 公司
    phone: { type: Number, required: true, unique: true }, // 电话号码
    name: { type: String, required: true },
    state: { type: Boolean, required: true },
    memo: { type: String, default: '' }, // 备注
  }, {
    toJson: { virtuals: true },
    timestamps: { createdAt: 'createTime', updatedAt: 'updateTime' },
  });

  return mongoose.model('User', UserSchema, 'user');
};
