ARG IMAGE=store/intersystems/iris-community:2020.1.0.199.0
ARG IMAGE=intersystemsdc/iris-community
ARG IMAGE=containers.intersystems.com/intersystems/iris-community:2025.3

FROM node:20-alpine AS frontend-build

WORKDIR /frontend

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build:dist

FROM $IMAGE

WORKDIR /home/irisowner/dev/

USER ${ISC_PACKAGE_MGRUSER}

RUN wget https://pm.community.intersystems.com/packages/zpm/0.9.2/installer -O /tmp/zpm.xml

ARG TESTS=0
ARG MODULE="iris-table-stats-frontend"
ARG NAMESPACE="USER"

COPY --chown=${ISC_PACKAGE_MGRUSER}:${ISC_PACKAGE_IRISGROUP} . .
COPY --from=frontend-build --chown=${ISC_PACKAGE_MGRUSER}:${ISC_PACKAGE_IRISGROUP} /frontend/dist ./dist

RUN iris start IRIS && \
	iris session IRIS < iris.script && \
    ([ $TESTS -eq 0 ] || iris session iris -U $NAMESPACE "##class(%ZPM.PackageManager).Shell(\"test $MODULE -v -only\",1,1)") && \
    iris stop IRIS quietly
