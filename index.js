'use strict';

const Hapi = require('@hapi/hapi');
const axios = require('axios') ;
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const Pack = require('./package');
const Joi = require('joi');

const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

    const swaggerOptions = {
        info: {
                title: 'Test API Documentation',
                version: Pack.version,
            },
        };

    await server.register([
        Inert,
        Vision,
        {
            plugin: HapiSwagger,
            options: swaggerOptions
        }
    ]);

    server.route({
        method: 'GET',
        path: '/',
        handler: (request, h) => {
            return 'Pomelo by Worrawee T.';
        }
    });

    server.route({
        method: 'POST',
        path: '/api',
        options: {
            handler: (request, h) => {
                const payload = request.payload ;     
                for (let i = Object.keys(payload).length-1;i >= 0 ; i--) {
                    for (let obj of payload[i]) {
                        let parent = obj.parent_id ;
                        if (i-1 >= 0) {
                            for (let pr of payload[i-1]){
                                if (pr.id === parent) {
                                    pr.children.push(obj) ;
                                }
                            }
                        }
                    }
                }
                return payload[0] ;
            } ,
            description: 'Constructing the family tree from the given data',
            notes: 'part1',
            tags: ['api'],
            validate:{
                payload:Joi.object()
            }
        }
    });

    server.route({
        method : 'GET',
        path: '/github',
        options: {
            handler: async(request,h) => {                                  
                const response = await axios.get(`https://api.github.com/search/code?q=${request.query.q}+user:mozilla&page=${request.query.page}&per_page=10`) ;
                return response.data ;
            },
            description: 'Search a word appeared on Github',
            notes: 'params\n\n1. q -- The word to be searched\n\n2. page -- The page number to search the word\n\nReturn at most 10 results for each search',
            tags: ['api'],
            validate: {
                query: Joi.object({
                    q: Joi.string(),
                    page: Joi.number()
                })
            }
        }
    }) ;

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();