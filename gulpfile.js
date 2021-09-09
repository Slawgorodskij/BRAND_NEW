const { src, dest, parallel, series, watch } = require('gulp');

const browserSync = require('browser-sync').create(),
  include = require('gulp-file-include'),
  htmlmin = require('gulp-htmlmin'),
  scss = require('gulp-sass')(require('sass')),
  cssnano = require('cssnano'),
  autoprefixer = require('gulp-autoprefixer'),
  groupMedia = require('gulp-group-css-media-queries'),
  postcss = require('gulp-postcss'),
  imagemin = require('gulp-imagemin'),
  newer = require('gulp-newer'),
  uglify = require('gulp-uglify-es').default,
  concat = require('gulp-concat'),
  notify = require('gulp-notify'),
  sourcemaps = require('gulp-sourcemaps'),
  del = require('del');
purgecss = require('@fullhuman/postcss-purgecss');

const htmlInclude = () => {
  return src('#src/*.html')
    .pipe(
      include({
        prefix: '@@',
      })
    )
    .pipe(dest('dist/product'))
    .pipe(
      htmlmin({
        collapseWhitespace: true,
      })
    )
    .pipe(dest('dist'))
    .pipe(browserSync.stream());
};

const styles = () => {
  return src('#src/scss/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(scss().on('error', notify.onError()))
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['last 2 versions'],
        grid: true,
        cascade: false,
      })
    )
    .pipe(groupMedia())
    .pipe(
      postcss([
        purgecss({
          content: ['#src/**/*.html'],
          css: ['**/*.css'],
        }),
        cssnano(),
      ])
    )
    .pipe(concat('style.min.css'))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('dist/css/'))
    .pipe(browserSync.stream());
};

const images = () => {
  return src('#src/images/**/*')
    .pipe(newer('dist/images/'))
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 75, progressive: true }),
        imagemin.optipng({ optimizationLevel: 4 }),
        imagemin.svgo({
          plugins: [{ removeViewBox: false }, { cleanupIDs: false }],
        }),
      ])
    )
    .pipe(dest('dist/images/'))
    .pipe(browserSync.stream());
};

const scripts = () => {
  return src('#src/js/script.js')
    .pipe(concat('script.js'))
    .pipe(uglify())
    .pipe(dest('dist/js'))
    .pipe(browserSync.stream());
};

const resources = () => {
  return src('#src/resources/**').pipe(dest('dist'));
};

const clear = () => {
  return del('dist');
};

const serve = () => {
  browserSync.init({
    server: {
      baseDir: 'dist/',
    },
    notify: false,
    online: true,
  });

  watch('#src/**/*.html', htmlInclude);
  watch('#src/scss/**/*', styles);
  watch('#src/images/**/*', images);
  watch('#src/**/*.js', scripts);
  watch('#src/resources/**', resources);
};

exports.images = images;
exports.serve = serve;
exports.clear = clear;
exports.styles = styles;
exports.htmlInclude = htmlInclude;
exports.scripts = scripts;

exports.default = series(
  clear,
  parallel(htmlInclude, scripts, resources, images),
  styles,
  serve
);

exports.build = series(clear, htmlInclude, styles, images, scripts);
