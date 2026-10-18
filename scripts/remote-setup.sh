#!/bin/bash
# One-time + every-deploy server side for paitza.com
# Run on the Ubuntu host as ubuntu (via ssh).
set -euo pipefail

DEST=/var/www/html
SRC="${HOME}/gvr-dist"
MODE="${1:-setup}"

have_sudo() {
  sudo -n true 2>/dev/null
}

fix_webroot_owner() {
  if ! have_sudo; then
    echo "NO_PASSWORDLESS_SUDO"
    echo "Выполните один раз на сервере:"
    echo "  sudo chown -R ubuntu:www-data ${DEST}"
    echo "  sudo chmod 2775 ${DEST}"
    echo "  sudo find ${DEST} -type d -exec chmod 2775 {} \\;"
    echo "  sudo find ${DEST} -type f -exec chmod 664 {} \\;"
    return 1
  fi

  sudo mkdir -p "${DEST}"
  sudo chown -R ubuntu:www-data "${DEST}"
  sudo find "${DEST}" -type d -exec chmod 2775 {} \;
  sudo find "${DEST}" -type f -exec chmod 664 {} \;
  sudo chmod 2775 "${DEST}"
  sudo usermod -aG www-data ubuntu || true
  echo "WEBROOT_OK ${DEST}"
}

fix_nginx_spa() {
  if ! have_sudo; then
    return 0
  fi

  local conf
  conf="$(grep -Rsl 'server_name' /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null | head -1 || true)"
  if [ -z "${conf}" ] && [ -f /etc/nginx/sites-enabled/default ]; then
    conf=/etc/nginx/sites-enabled/default
  fi
  if [ -z "${conf}" ] || [ ! -f "${conf}" ]; then
    echo "NGINX_CONF_NOT_FOUND"
    return 0
  fi

  sudo cp -a "${conf}" "${conf}.bak.gvr"
  # SPA fallback: keep /node proxy intact (separate location).
  sudo sed -i \
    -e 's|try_files $uri $uri/ =404;|try_files $uri $uri/ /index.html;|g' \
    -e 's|try_files $uri $uri/;|try_files $uri $uri/ /index.html;|g' \
    "${conf}"

  if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "NGINX_RELOADED ${conf}"
  else
    echo "NGINX_TEST_FAILED, restoring"
    sudo cp -a "${conf}.bak.gvr" "${conf}"
    return 1
  fi
}

publish_dist() {
  if [ ! -f "${SRC}/index.html" ]; then
    echo "MISSING ${SRC}/index.html — сначала scp dist в ~/gvr-dist"
    exit 1
  fi

  mkdir -p "${DEST}"

  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete --exclude lost+found "${SRC}/" "${DEST}/"
  else
    find "${DEST}" -mindepth 1 -maxdepth 1 ! -name lost+found -exec rm -rf {} +
    cp -a "${SRC}/." "${DEST}/"
  fi

  find "${DEST}" -type d -exec chmod 2775 {} \;
  find "${DEST}" -type f -exec chmod 664 {} \;
  echo "PUBLISHED $(ls -1 "${DEST}" | wc -l) entries in ${DEST}"
}

case "${MODE}" in
  setup)
    fix_webroot_owner
    fix_nginx_spa
    ;;
  publish)
    fix_webroot_owner || true
    publish_dist
    ;;
  *)
    echo "usage: $0 setup|publish"
    exit 1
    ;;
esac
