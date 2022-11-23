# set base image
FROM public.ecr.aws/bitnami/node:14

# set the working directory in the container
WORKDIR /usr/src/web

# copy the dependencies file to the working directory
COPY package*.json  ./

# copy app source to the working directory
COPY . .

# install dependencies
RUN npm install

# https://docs.docker.com/engine/reference/builder/#expose
EXPOSE 8080

# command to run on container start
CMD [ "node", "server.js" ]
