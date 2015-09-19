'use strict';

let chalk    = require('chalk');
let throttle = require('./throttle');

const partials = ['▏', '▎', '▍', '▋', '▊', '▉'].map((p) => chalk.green(p));

function progress(opts) {
  if (typeof(opts) === 'number') {
    opts = {total: opts};
  }
  let stderr = process.stderr;
  let bar = {
    total:    opts.total,
    width:    opts.width || 25,
    tmpl:     opts.tmpl || ':bar :percent :eta',
    cur:      0,
    percent:  0,
    complete: false,
    start:    new Date(),
  };

  let termWidth = stderr.isTTY ? stderr.getWindowSize()[0] : 80;

  let pad = (num) => num < 10 ? '0' + num.toString() : num.toString();

  function line () {
    return bar.tmpl
    .replace(':bar', renderBar())
    .replace(':percent', pad(Math.round(bar.percent * 100)) + '%')
    .replace(':eta', eta());
  }

  function renderBar () {
    let output = '';
    let ticks = bar.percent * bar.width - 1;
    if (ticks < 0) ticks = 0;
    let filled = Math.floor(ticks);
    let open   = bar.width - filled - 1;
    output += chalk.green('▉').repeat(filled);
    output += partials[Math.floor((ticks - filled)*partials.length)];
    output += ' '.repeat(open) + ' ';
    return output;
  }

  function eta () {
    let elapsed = new Date() - bar.start;
    let eta = Math.abs(((bar.percent === 100) ? 0 : elapsed * (bar.total / bar.cur - 1))/1000);
    let hours =   Math.floor(eta/3600);
    let minutes = Math.floor((eta-(hours*3600))/60);
    let seconds = Math.round(eta-(hours*3600)-(minutes*60));
    if (hours) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    else {
      return `${pad(minutes)}:${pad(seconds)}`;
    }
  }

  function render (tokens) {
    if (!stderr.isTTY) return;
    if (bar.complete) return;
    stderr.cursorTo(0);
    stderr.clearLine();
    stderr.write(line(tokens));
    stderr.cursorTo(termWidth);
  }
  let throttledRender = throttle(render, 16);

  function done () {
    render();
    bar.complete = true;
    stderr.write('\n');
  }

  bar.tick = function (inc, tokens) {
    bar.cur += inc;
    bar.percent = parseFloat(bar.cur)/bar.total;
    if (bar.percent > 1) bar.percent = 1;
    if (bar.percent < 0) bar.percent = 0;

    throttledRender(tokens);

    if (bar.cur >= bar.total) done();
  };

  return bar;
}

module.exports = progress;
