# ALEC Vizualiation [![CircleCI](https://circleci.com/gh/OpenNMS/alec-viz.svg?style=svg)](https://circleci.com/gh/OpenNMS/alec-viz)

An experimental visualization tool for viewing datasets generated with [ALEC](https://github.com/OpenNMS/alec).

## Getting started

Start by generating a dataset from your ALEC instance.
You can do this using the `datasource-snapshot` from the Karaf shell:
```
opennms-alec:datasource-snapshot /tmp/dataset
```

Run the visualization stack quickly with our [Docker](https://hub.docker.com/r/opennms/alec-viz) image:
```
docker run -p 8082:8080 -v /tmp/dataset:/dataset opennms/alec-viz
```

Then browse to: http://localhost:8082/static/index.html and explore

## VR Support

The UI has support for WebVR and has been tested using the Oculus Go headset.

When viewing the UI from the Oculus browser, you should see a VR mode button appear on the left toolbar.
Select this to enter *VR MODE*.

