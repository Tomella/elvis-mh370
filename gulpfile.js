// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var fs            = require('fs');
var header        = require('gulp-header');
var jshint        = require('gulp-jshint');
var babel         = require('gulp-babel');
var sass          = require('gulp-sass');
var concat        = require('gulp-concat');
var concatCss     = require('gulp-concat-css');
var insert        = require('gulp-insert');
var uglify        = require('gulp-uglify');
var rename        = require('gulp-rename');
var templateCache = require('gulp-angular-templatecache');
var zip           = require('gulp-zip');
var addStream     = require('add-stream');

var directories = {
	assets:      'dist/bathy/assets',
	source:      'source',
	resources:  'resources',
	outresources:'dist/bathy/resources',
   views:      'views',
   outbower:   'dist/bathy/bower_components'
};

// Lint Task
gulp.task('lint', function() {
    return gulp.src(directories.source + '/**/*.js')
        .pipe(jshint({esversion: 6}))
        .pipe(jshint.reporter('default'));
});

gulp.task('resources', function () {
    return gulp.src(directories.resources + '/**/*')
        .pipe(gulp.dest(directories.outresources));
});

gulp.task('views', function () {
    return gulp.src(directories.views + '/**/*')
        .pipe(gulp.dest('dist'));
});

//Concatenate & Minify JS
gulp.task('scripts', function() {
   return prepareScripts();
});

function prepareScripts() {
   return gulp.src(directories.source + '/**/*.js')
      .pipe(babel({
            compact: false,
            comments: true,
            presets: ['es2015', 'es2016', 'es2017']
      }))
	   .pipe(addStream.obj(prepareNamedTemplates()))
      .pipe(concat('bathy.js'))
      .pipe(header(fs.readFileSync(directories.source + '/licence.txt', 'utf8')))
      .pipe(gulp.dest(directories.assets));
}


//Concatenate & Minify JS
gulp.task('squash', function() {
	return squashJs('bathy');
});

function squashJs(name) {
	return gulp.src(directories.assets + '/' + name + '.js')
		.pipe(uglify())
		.pipe(gulp.dest(directories.assets + "/min"));
}

// Watch Files For Changes
gulp.task('watch', function() {
	// We watch both JS and HTML files.
    gulp.watch(directories.source + '/**/*(*.js|*.html)', ['lint']);
    gulp.watch(directories.source + '/**/*(*.js|*.html)', ['scripts']);
    gulp.watch(directories.source + '/**/*.css', ['concatCss']);
    gulp.watch(directories.assets + '/bathy.js', ['squash']);
    gulp.watch(directories.views +  '/*', ['views']);
    gulp.watch(directories.resources + '/**/*', ['resources']);
    //gulp.watch('scss/*.scss', ['sass']);
});

gulp.task('concatCss', function () {
  return gulp.src(directories.source + '/**/*.css')
    .pipe(concatCss("bathy.css"))
    .pipe(gulp.dest(directories.assets));
});

gulp.task('package', function() {
   return gulp.src('package.json')
      .pipe(gulp.dest(directories.assets));
});

gulp.task('build', ['views', 'package', 'scripts', 'concatCss', 'resources'])

// Default Task
gulp.task('default', ['lint', 'scripts', 'concatCss', 'watch', 'package', 'resources', 'views']);


function prepareNamedTemplates() {
   return gulp.src(directories.source + '/**/*.html')
      .pipe(templateCache({module: "bathy.templates", standalone : true}));
}