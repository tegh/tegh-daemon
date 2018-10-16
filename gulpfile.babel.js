import chalk from 'chalk'
import rimraf from 'rimraf'
import path from 'path'
import gulp from 'gulp'
import babel from 'gulp-babel'
// import through from 'through2'
import plumber from 'gulp-plumber'
import gutil from 'gulp-util'
import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'

import packageJSON from './package.json'
import babelConfig from './.babelrc'
import webpackConfig from './webpack.config.babel'

const { packages } = packageJSON.workspaces

// const compilationLogger = () => (
//   through.obj((file, enc, callback) => {
//     gutil.log(`Compiling '${chalk.cyan(file.relative)}'...`)
//     callback(null, file)
//   })
// )

const errorsLogger = () => (
  plumber({
    errorHandler: (err) => {
      gutil.log(err.stack)
    },
  })
)

const clean = (done) => {
  rimraf(path.join(__dirname, 'packages/*/dist'), done)
}

const srcFiles = `packages/@(${packages.join('|').replace(/packages\//g, '')})/src/**/*.js`

const buildProcess = gulpInput => (
  gulpInput
    .pipe(errorsLogger())
    // .pipe(compilationLogger())
    .pipe(babel(babelConfig))
    .pipe(gulp.dest((file) => {
      const dir = path.join('packages', file.relative.replace(/\/src\/.*/, '/dist/'))
      // eslint-disable-next-line no-param-reassign
      file.path = file.relative.replace(/.*\/src\//, 'dist/')
      return dir
    }))
)

const build = () => (
  // gutil.log(`Building '${chalk.cyan(pkg.name())}'`)
  buildProcess(
    gulp.src(srcFiles, { base: 'packages' }),
  )
)

const watch = () => {
  const watcher = gulp.watch(srcFiles, { delay: 50 })
  watcher.on('change', (filePath) => {
    gutil.log(`Compiling '${chalk.cyan(filePath)}'...`)
    buildProcess(
      gulp.src(filePath, { base: 'packages' }),
    )
  })
}

const webpackDevServerTask = () => {
  // Start a webpack-dev-server
  const compiler = webpack({
    // configuration
    mode: 'development',
    ...webpackConfig,
  })

  new WebpackDevServer(compiler, {
    // server and middleware options
  }).listen(8080, 'localhost', (err) => {
    if (err) throw new gutil.PluginError('webpack-dev-server', err)
    // Server listening
    gutil.log(
      '[webpack-dev-server]',
      'http://localhost:8080/webpack-dev-server/index.html',
    )
    // keep the server alive or continue?
    // callback();
  })
}

gulp.task('clean', clean)

gulp.task('build', gulp.series('clean', build))

gulp.task('watch', gulp.series('build', watch))

gulp.task('webpack-dev-server', webpackDevServerTask)

gulp.task(
  'start',
  gulp.series(
    'clean',
    'build',
    gulp.parallel(
      watch,
      webpackDevServerTask,
    ),
  ),
)
