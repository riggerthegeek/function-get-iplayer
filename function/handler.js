/**
 * handler
 */

/* Node modules */
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

/* Third-party modules */
require('isomorphic-fetch');
const { Dropbox } = require('dropbox');
const glob = require('glob');
const yml = require('js-yaml');

/* Files */

let dropboxKey;
try {
  dropboxKey = fs.readFileSync('/run/secrets/dropboxKey');
} catch (err) {
  dropboxKey = process.env.DROPBOX_TOKEN;
}

const config = {
  dataDir: '/home/node/data',
  dropboxKey,
  uploadDir: process.env.UPLOAD_DIR || '/iPlayer Uploads'
};

const dbx = new Dropbox({
  accessToken: config.dropboxKey
});

const extDirectory = [{
  dir: 'Radio',
  ext: [
    '.m4a'
  ]
}, {
  dir: 'TV',
  ext: [
    '.mp4'
  ]
}];

module.exports = input => Promise
  .resolve()
  .then(() => {
    /* JSON is valid YAML */
    const inputArgs = yml.safeLoad(input);
    const pid = inputArgs.id;

    /* Download the file */
    const cmd = [
      'get_iplayer',
      '--nocopyright',
      '--subdir',
      '--force',
      '--whitespace',
      `--output="${config.dataDir}"`,
      `--pid="${pid}"`
    ];

    /* Removes space-PID-anything (usually ' 12345 original') */
    const pidRegex = new RegExp(`(\\s+)?${pid}.+`);

    return util.promisify(exec)(cmd.join(' '))
      .then(() => util.promisify(glob)(`${config.dataDir}/**/*${pid}*`))
      .then((result) => {
        /* Only ever likely to be length 1 */
        const tasks = result.map((filePath) => {
          const fileObj = path.parse(filePath);

          fileObj.dir = fileObj.dir.replace(config.dataDir, '');
          fileObj.name = fileObj.name.replace(pidRegex, '');

          let subdir = extDirectory.find(({ ext }) => ext.includes(fileObj.ext));

          if (subdir) {
            subdir = subdir.dir;
          } else {
            subdir = 'Misc';
          }

          const uploadPath = path.join(config.uploadDir, subdir, fileObj.dir, fileObj.name + fileObj.ext);

          return util.promisify(fs.readFile)(filePath)
            .then(contents => dbx.filesUpload({
              contents,
              path: uploadPath,
              mode: {
                '.tag': 'overwrite'
              }
            }));
        });

        return Promise.all(tasks);
      })
      .then(() => ({
        pid,
        status: 'success'
      }));
  });
