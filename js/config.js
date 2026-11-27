/*
  Viewer settings.
  ionToken: your Cesium ion access token. It is visible to anyone who opens the
  page, so once the site is hosted, restrict the token to your site's URL in the
  Cesium ion dashboard (Access Tokens > Allowed URLs).
  Leave it empty to run without terrain (flat globe, OpenStreetMap imagery).
*/
window.BOE_CONFIG = {
  ionToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6Imo1NUpQaUlQT3hkdnhGNnQiLCJqdGkiOiJlMjM2YWU0OS04ZjVkLTQzZjUtYWY4MS1kZjcwMjgxNWE1NWUiLCJpZCI6NTU4MjEzLCJzdWIiOiJKY2Fyc29uMDA2IiwiaXNzIjoiaHR0cHM6Ly9hcGkuY2VzaXVtLmNvbSIsImF1ZCI6IlZpc3VhbCBCT0UiLCJpYXQiOjE3OTU4MDE1NjF9.M9aF48YOLyAYv3QYFVhas00u_QNqJZjz2j1at2kOpmk",
  terrainExaggeration: 1.5,
  profileSampleSpacing_m: 100
};
