export interface MonitorInfo {
  secretToken: string;
  company: string;
  tokenNum: number;
  stopTokenNum: number;
  removeTokenNum: number;
  missTokenNum: number;
  deadTokenNum: number;
  detailInfo: {
    userTokenList: [];
    tokenDockerMap: any;
  };
}
