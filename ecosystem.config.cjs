// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'wllt-landing',
      cwd: '.', // 改成你的项目路径
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      exec_mode: 'cluster',
      instances: 'max',

      env: {
        NODE_ENV: 'production',

        BASE_API: 'api.purtx.cn,api.mygojy.cn,api.xwkow.cn',
        COMMON_API: '192.252.187.70:9001,d1a61pr1imdx29.cloudfront.net,...',
      },

      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      watch: false,
    },
  ],
};
