import axios from 'axios';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;

const token = document.head.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');

if (token?.content) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
}
