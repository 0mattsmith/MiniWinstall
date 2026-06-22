# Maintainer: Windows Tiny 11 Community <0matthewsmith@gmail.com>
pkgname=mini-winstall-engine
pkgver=0.1.0
pkgrel=1
pkgdesc="High-performance cross-platform Windows image customizer written in Rust. Compiles locally using cargo and wimlib."
arch=('x86_64')
url="https://github.com/0matthewsmith/mini-winstall-engine"
license=('MIT')
depends=('wimlib' 'xorriso' 'wget' 'p7zip')
makedepends=('cargo')
options=('!lto')

build() {
  cd "$startdir"
  cargo build --release --locked
}

package() {
  cd "$startdir"
  install -Dm755 "target/release/mini-winstall-engine" "$pkgdir/usr/bin/mini-winstall-engine"
}
