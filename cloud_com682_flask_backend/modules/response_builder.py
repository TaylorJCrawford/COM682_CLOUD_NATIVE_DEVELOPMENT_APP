from flask import Flask, request, jsonify, make_response, send_file
import yaml
from azure.cosmos import exceptions, CosmosClient, PartitionKey
from azure.storage.queue import (
        QueueService,
        QueueMessageFormat
)
from azure.data.tables import TableServiceClient
from azure.storage.blob import ContainerClient
import os
import uuid
import datetime
import azure.cognitiveservices.speech as speechsdk
import time

class cosmos_db_message_connection():

    def __init__(self):
        self.config = load_config()
        self.endpoint = self.config["cosmos_db_uri"]
        self.key = self.config["cosmos_db_primary_key"]
        self.client = CosmosClient(url=self.endpoint, credential=self.key)
        self.database = self.client.get_database_client("Metadata")
        self.container = self.database.get_container_client("ModeratedComments")

class cosmos_db_connection():

    def __init__(self):
        self.config = load_config()
        self.endpoint = self.config["cosmos_db_uri"]
        self.key = self.config["cosmos_db_primary_key"]
        self.client = CosmosClient(url=self.endpoint, credential=self.key)
        self.database = self.client.get_database_client("Metadata")
        self.container = self.database.get_container_client("Movies")

class table_db_connection():

    def __init__(self):
        self.config = load_config()
        self.connection_string = self.config['azure_storage_connectionstring']

def set_account_level_response_builder(sub_id, new_role):

    table_connection = table_db_connection()
    connection_string = table_connection.connection_string

    table_service_client = TableServiceClient.from_connection_string(conn_str=connection_string)
    table_name = "users"
    table_client = table_service_client.get_table_client(table_name=table_name)

    replaced = table_client.get_entity(partition_key=sub_id, row_key=sub_id + '123')
    replaced['Role'] = new_role

    table_client.update_entity(replaced)


    response = jsonify({ "message" : "User role has been updated to: " + new_role })
    response.status_code = 201
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


def add_new_account_response_builder(sub_id, role):

    table_connection = table_db_connection()
    connection_string = table_connection.connection_string

    my_entity = {
        u'PartitionKey': sub_id,
        u'RowKey': sub_id + '123',
        u'Role' : role
    }

    table_service_client = TableServiceClient.from_connection_string(conn_str=connection_string)
    table_name = "users"
    table_client = table_service_client.get_table_client(table_name=table_name)

    entity = table_client.create_entity(entity=my_entity)

    print(entity)

    # response = jsonify({'message' : 'New entity has been added to the user table.'})
    # response.status_code = 201
    # response.headers.add('Access-Control-Allow-Origin', '*')
    # return response

def get_user_role_response_builder(sub_id):
    my_filter = "PartitionKey eq '" + sub_id + "'"

    table_connection = table_db_connection()
    connection_string = table_connection.connection_string

    table_service_client = TableServiceClient.from_connection_string(conn_str=connection_string)
    table_name = "users"
    table_client = table_service_client.get_table_client(table_name=table_name)

    entities = table_client.query_entities(my_filter)
    result = []
    for entity in entities:
        for key in entity.keys():
            print("Key: {}, Value: {}".format(key, entity[key]))
            # entity[key]
            result.append(entity[key])
    if result != []:
        response = jsonify({'role' : result[2]})
        response.status_code = 201
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    else:
        # User doesn't exist in table. So going to create a new entry.
        if sub_id != 'null':
            add_new_account_response_builder(sub_id, 'user')
            pass
        else:
            response = jsonify({ "error" : "Invalid - Entity has not been made." })
            response.status_code = 404
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
    response = jsonify({ "message" : "No user account stored added to table.", 'role' : 'user' })
    response.status_code = 201
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

def load_config():
    dir_root = os.path.dirname(os.path.abspath(__file__))
    with open(dir_root + "/config.yaml", "r") as yamlfile:
        return yaml.load(yamlfile, Loader=yaml.FullLoader)

def check_field_types(fields :list, request) -> list:

    invalid_fields = {}
    for key in fields:
        if key not in request.form:
            invalid_fields[key] = "The " + key + " field is required."

    return invalid_fields

def query_db(new_query):

    conection = cosmos_db_connection()

    items = []
    for item in conection.container.query_items(
                query=new_query,
                enable_cross_partition_query=True):
        items.append(item)
    return items

def query_db_comment(new_query):

    conection = cosmos_db_message_connection()

    items = []
    for item in conection.container.query_items(
                query=new_query,
                enable_cross_partition_query=True):
        items.append(item)
    return items

def get_all_clips_response_builder():
    # result = query_db('SELECT top 2 * FROM Movies order by Movies._ts desc')
    result = query_db('SELECT top 20 * FROM Movies order by Movies._ts desc')
    response = jsonify(result)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

def get_clip_by_id_response_builder(id):
    result = query_db('SELECT * FROM Movies WHERE Movies.id="' + id + '"')

    for review in result[0]['feedback']:
        review['comment'] = check_comment_moderation_value(review)
    return result

def check_comment_moderation_value(review):

    result = query_db_comment('SELECT * FROM ModeratedComments WHERE ModeratedComments.comment_id="' + review['comment_id'] + '"')
    try:
        if (result[0]['classification'] == [] and result[0]['allowed'] == True):
            return review['comment']
        elif (result[0]['classification'] == []):
            return 'PENDING CHECKS'
        elif (result[0]['allowed'] == False):
            return 'CONTENT HAS BEEN CLASSED AS OFFENSIVE'
        return review['comment']
    except Exception as e:
        print(e)
        return 'ERROR LOADING COMMENT'

def upload_file_to_blob(request, container_name, form_key):
    config = load_config()

    connection_string = config["azure_storage_connectionstring"]
    container_client = ContainerClient.from_connection_string(connection_string, container_name)
    print(form_key)
    print(request.files.getlist(form_key))
    for file in request.files.getlist(form_key):

        try:
            print(f'{file.name} uploaded to blob storage')
            # upload the file to the container using the filename as the blob name
            container_client.upload_blob(file.filename, file)
            print(f'{file.name} upload complete')
        except Exception as e:
            print(e)
            # ignore duplicate filenames
            print("Ignoring duplicate filenames")

def remove_file_from_blob(container_name, file_name):
    config = load_config()

    connection_string = config["azure_storage_connectionstring"]
    container_client = ContainerClient.from_connection_string(connection_string, container_name)

    try:
        print(f'{file_name} is being removing from blob storage')
        # upload the file to the container using the filename as the blob name
        container_client.delete_blob(file_name, delete_snapshots="include")
        print(f'{file_name}, removal complete')
    except Exception as e:
        print(e)
        # ignore duplicate filenames
        print("Ignoring duplicate filenames")

def add_new_clip_response_builder(request):

    conection = cosmos_db_connection()

    required_fields = ['producer', 'publisher', 'thumbnail',
    'title', 'video_file', 'genra', 'age_rating']

    missing_fields = check_field_types(required_fields, request)

    if len(missing_fields) == 0:

        # Create new object for storage.
        new_id = str(uuid.uuid4())

        new_item = {
            'id' : new_id,
            'title' : request.form['title'],
            'user_id' : request.form['user_id'],
            'publisher' : request.form['publisher'],
            'producer' : request.form['producer'],
            'age_rating' : int(request.form['age_rating']),
            'upload_date_time' : str(datetime.datetime.now()),
            'video_file' : request.form['video_file'],
            'thumbnail' : request.form['thumbnail'],
            'genra' : request.form['genra'].split(','),
            'feedback' : [],
            'transcription' : ""
        }

        conection.container.upsert_item(new_item)
        url = 'http://127.0.0.1:5000/api/v1.0/clips/' + new_id

        response = jsonify({'url' : url, 'message' : 'Complete', 'id' : new_id})
        response.status_code = 201
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

    response = jsonify({"message" : "The given data was invalid.", "errors": missing_fields })
    response.status_code = 422
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

def update_field(request, field, object_ref):

    if field in request.form:
        if field == 'genra':
            object_ref[field] = request.form['genra'].split(',')
        else:
            object_ref[field] = request.form[field]

def update_clip_content_by_id_response_data(id):
    conection = cosmos_db_connection()
    stored_clip = get_clip_by_id_response_builder(id)
    print(len(stored_clip))

    if len(stored_clip) == 1:
        stored_clip = stored_clip[0]
        print(stored_clip)

        fields_to_check_for_updates = ['title', 'publisher',
            'producer', 'age_rating', 'video_file', 'thumbnail', 'genra']

        for field in fields_to_check_for_updates:
            update_field(request, field, stored_clip)

        response = conection.container.upsert_item(body=stored_clip)
        print(len(response))

        if len(response) != 0:
            response = jsonify({ "url": "done"})
            response.status_code = 201
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        else:
            # Should never get into here.
            response = jsonify({ "error": "Ran into a problem"})
            response.status_code = 500
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
    else:
        response = jsonify({ "error" : "Invalid clip id - not found." })
        response.status_code = 404
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

def remove_clip_by_id_response_data(id):

    conection = cosmos_db_connection()
    config = load_config()

    for item in conection.container.query_items(query='SELECT * FROM Movies WHERE Movies.id = "' + id + '"',
                                  enable_cross_partition_query=True):
        print(item)
        conection.container.delete_item(item, partition_key=id)
        remove_file_from_blob(config["videos_container_name"], item['video_file'])
        remove_file_from_blob(config["thumbnails_container_name"], item['thumbnail'])

    response = jsonify({ "message": "Complete", "status_code" : 201})
    response.status_code = 201
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

def add_comment_to_clip_response_builder(request, clip_id, user_id):
    print(clip_id)

    conection = cosmos_db_connection()
    clip_data = get_clip_by_id_response_builder(clip_id)

    required_fields = ['comment', 'rating']

    missing_fields = check_field_types(required_fields, request)

    if len(missing_fields) == 0:
        print(clip_data)
        clip_data= clip_data[0]

        new_comment_id = str(uuid.uuid4())
        new_comment = {
            'comment_id' : new_comment_id,
            'user_id' : user_id,
            'comment' : request.form['comment'],
            'rating' : int(request.form['rating'])
        }

        temp_list = clip_data['feedback']
        temp_list.append(new_comment)
        clip_data['feedback'] = temp_list

        response = conection.container.upsert_item(body=clip_data)
        comment_moderation(new_comment_id, request.form['comment'])

        if len(response) != 0:
            url = 'http://127.0.0.1:5000/api/v1.0/clips/' + clip_data['id']
            response = jsonify(url)
            response.status_code = 201
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response

        response = jsonify({ "error": "Ran into a problem"})
        response.status_code = 500
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    else:
        response = jsonify({"message" : "The given data was invalid.", "errors": missing_fields })
        response.status_code = 422
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

def get_comment_by_id(comment_id):
    data = query_db('SELECT * FROM Movies')

    for movie in data:
        comments = movie['feedback']
        for comment in comments:
            try:
                print(comment['comment_id'])
                print(comment['comment_id'] == comment_id)
                if comment['comment_id'] == comment_id:
                    response = jsonify({ "Movie ID" : movie['id'],
                        "Movie title" : movie['title'], "comment" : comment})
                    response.status_code = 200
                    response.headers.add('Access-Control-Allow-Origin', '*')
                    return response
            except:
                # Some clips may not have comments so we are catching key errors here.
                pass

    response = jsonify({ "error" : "Comment Has Not Be Found." })
    response.status_code = 404
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

def update_comment_by_id(comment_id):
    data = query_db('SELECT * FROM Movies')
    conection = cosmos_db_connection()

    for movie in data:
        comments = movie['feedback']
        for comment in comments:
            try:
                if comment['comment_id'] == comment_id:
                    if 'comment' in request.form:
                        comment['comment'] = request.form['comment']
                    if 'rating' in request.form:
                        comment['rating'] = request.form['rating']

                    response = conection.container.upsert_item(body=movie)

                    if len(response) != 0:
                        response = jsonify({ "message": "Complete"})
                        response.status_code = 201
                        response.headers.add('Access-Control-Allow-Origin', '*')
                        return response

                    # Should never get into here.
                    response = jsonify({ "error": "Ran into a problem"})
                    response.status_code = 500
                    response.headers.add('Access-Control-Allow-Origin', '*')
                    return response
            except Exception as e:
                # Some clips may not have comments so we are catching key errors here.
                print(e)
                pass
    response = jsonify({ "error" : "Comment Has Not Be Found." })
    response.status_code = 404
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

def remove_comment_by_id(comment_id):
    data = query_db('SELECT * FROM Movies')
    conection = cosmos_db_connection()
    message_connection = cosmos_db_message_connection()
    new_comment_list = []


    for movie in data:
        for comment in movie['feedback']:
            if comment['comment_id'] == comment_id:
                # Comment has been found in current movie. - Therefore going to
                # stop at current movie - NEED A NICE WAY??
                for comment in movie['feedback']:
                    if comment['comment_id'] != comment_id:
                        new_comment_list.append(comment)
                movie['feedback'] = new_comment_list
                response = conection.container.upsert_item(body=movie)
                break

    if len(response) != 0:

        # Remove Comment For Mod Document
        print('Removing Comment Mod')
        for item in message_connection.container.query_items(query='SELECT * FROM ModeratedComments WHERE ModeratedComments.comment_id = "' + comment_id + '"',
                                  enable_cross_partition_query=True):
            message_connection.container.delete_item(item, partition_key=item['id'])

        response = jsonify(response)
        response.status_code = 201
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

    # Should never get into here.
    response = jsonify({ "error": "Ran into a problem"})
    response.status_code = 500
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

def get_poster_by_id_response_builder(id):

    config = load_config()
    connection_string = config["azure_storage_connectionstring"]
    container_name = config["thumbnails_container_name"]
    container_client = ContainerClient.from_connection_string(connection_string, container_name)
    # list all the blobs in the container
    blob_items = container_client.list_blobs()

    data = get_clip_by_id_response_builder(id)

    data= data[0]

    thumbnail = data['thumbnail']
    print(thumbnail)
    blob_client = ""

    for blob in blob_items:
        if thumbnail == blob.name:
            blob_client = container_client.get_blob_client(blob=blob.name)
            response = jsonify({ "url" : blob_client.url})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response

    response = jsonify({ "message": "Complete"})
    response.status_code = 201
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

def search_by_title(search_term):
    data = query_db("SELECT * FROM Movies Where Movies.title Like '[" + search_term + "]%'")
    print(data)
    response = jsonify(data)
    response.status_code = 200
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

def comment_moderation(comment_id, comment):

    comment = str(comment)
    message_connection = cosmos_db_message_connection()

    queue_name = 'comments-for-checking'
    config = load_config()
    connect_str = config["azure_storage_connectionstring"]

    print("Adding message for content moderation checking: " + comment)
    queue_service = QueueService(connection_string=connect_str)

    # Add message to queue for checking.
    message_query = queue_service.put_message(queue_name, comment)

    new_item = {
        'id' : message_query.id,
        'comment_id' : comment_id,
        'allowed' : False,
        'classification' : []
    }

    # Add message To container.
    message_connection.container.upsert_item(new_item)

def convert_video_to_text_helper(file):
    # Credit: Micosoft
    # https://github.com/Azure-Samples/cognitive-services-speech-sdk/blob/master/samples/python/console/speech_sample.py#:~:text=def%20speech_recognize_continuous_from_file()%3A
    config = load_config()
    speech_config = speechsdk.SpeechConfig(
        subscription=config["speech_config_subscription"],
        endpoint=config["speech_config_endpoint"])

    audio_config = speechsdk.audio.AudioConfig(filename=file)

    speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

    done = False

    def stop_cb(evt: speechsdk.SessionEventArgs):
        """callback that signals to stop continuous recognition upon receiving an event `evt`"""
        print('CLOSING on {}'.format(evt))
        nonlocal done
        done = True

    results = []
    def on_recognized(evt):
        assert (
            evt.result.reason == speechsdk.ResultReason.RecognizedSpeech
        ), "A portion was not recognized."
        results.append(evt.result.text)
        print("RECOGNIZED: {}".format(evt))

    speech_recognizer.recognized.connect(on_recognized)
    speech_recognizer.session_stopped.connect(stop_cb)

    # Start continuous speech recognition
    speech_recognizer.start_continuous_recognition()
    while not done:
        time.sleep(.5)

    speech_recognizer.stop_continuous_recognition()

    return results

def add_text_to_video_db(transcription, doc_id):

    conection = cosmos_db_connection()

    read_item = conection.container.read_item(item=doc_id, partition_key=doc_id)
    read_item['transcription'] = str(transcription)
    conection.container.upsert_item(body=read_item)
    print("Transcript added.")