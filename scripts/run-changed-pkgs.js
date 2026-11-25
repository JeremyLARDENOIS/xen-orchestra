#!/usr/bin/env node

'use strict'

const { spawnSync } = require('child_process')
const { join, relative, sep } = require('path')

const [, , script, ...files] = process.argv

const root = join(__dirname, '..')

// changed files, grouped by package
const pkgs = new Map()
for (const file of files) {
  const parts = relative(root, file).split(sep)
  if ((parts.length > 2 && parts[0] === 'packages') || parts[0][0] === '@') {
    const pkg = parts.slice(0, 2).join(sep)
    let pkgFiles = pkgs.get(pkg)
    if (pkgFiles === undefined) {
      pkgs.set(pkg, (pkgFiles = []))
    }
    pkgFiles.push(file)
  }
}

function npm(args) {
  const { status } = spawnSync('npm', args, { cwd: root, stdio: 'inherit' })
  if (status !== 0) {
    process.exit(status)
  }
}

// a package declaring `<script>:related` only runs what depends on its changed files, which are passed to it
const relatedScript = `${script}:related`
const others = []
for (const [pkg, pkgFiles] of pkgs) {
  const { scripts = {} } = require(join(root, pkg, 'package.json'))
  if (relatedScript in scripts) {
    npm(['run', relatedScript, '-w', pkg, '--', ...pkgFiles])
  } else {
    others.push(pkg)
  }
}

if (others.length !== 0) {
  const args = ['run', '--if-present', script]
  for (const pkg of others) {
    args.push('-w', pkg)
  }
  npm(args)
}
