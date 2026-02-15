import { mount } from 'svelte'
import './app.css'
import AdminApp from './AdminApp.svelte'

mount(AdminApp, {
  target: document.getElementById('app'),
})
