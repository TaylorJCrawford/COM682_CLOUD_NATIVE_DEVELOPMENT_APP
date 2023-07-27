from flask import Flask, request, jsonify, make_response, redirect
import modules.response_builder as builder
from azure.storage.blob import ContainerClient
from flask_cors import CORS
import os
from azure.data.tables import TableServiceClient
from flask_swagger_ui import get_swaggerui_blueprint

app = Flask(__name__) #creating the Flask class object
CORS(app)

# Swagger Config
SWAGGER_URL = '/swagger'
API_URL = '/static/swagger.json'
SWAGGER_BLUEPRINT = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config = {
        'app_name' : 'Cloud COM682'
    }
)

app.register_blueprint(SWAGGER_BLUEPRINT, url_prefix = SWAGGER_URL)

VERSION_01_API = '/api/v1.0'

# @app.route( VERSION_01_API + '/account/<sub_id>/<role>', methods=['GET'])
# def is_online(sub_id, role):
#     return builder.add_new_account_response_builder(sub_id, role)

@app.route( VERSION_01_API + '/account/<sub_id>/<role>', methods=['GET'])
def set_new_account_role(sub_id, role):
    return builder.set_account_level_response_builder(sub_id, role)

@app.route( VERSION_01_API + "/account/<sub_id>", methods=['GET'])
def testing_table(sub_id):
    return builder.get_user_role_response_builder(sub_id)

@app.route(VERSION_01_API + '/upload/thumbnail', methods=['POST'])
def update_file_endpoint():
    builder.upload_file_to_blob(request, "thumbnails", "thumbnail_file")
    response = jsonify({ "message": "done"})
    response.status_code = 201
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route(VERSION_01_API + '/upload/video', methods=['POST'])
def update_file_endpoint_video_temp():
    builder.upload_file_to_blob(request, "videos", "video_file")
    response = jsonify({ "url": "done"})
    response.status_code = 201
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route(VERSION_01_API + '/poster/<id>', methods=['GET'])
def get_poster(id):
    return builder.get_poster_by_id_response_builder(id)

# GET /clips?pn=x&ps=x
# Pagination Defaults to 1 and 10
@app.route(VERSION_01_API + '/clips', methods=['GET'])
def clip_home():
    return builder.get_all_clips_response_builder()

# GET /clips/<id>
# Meta Data for specific clip
@app.route(VERSION_01_API + '/clips/<id>', methods=['GET'])
def clip_by_id(id):
    result = builder.get_clip_by_id_response_builder(id)
    response = jsonify(result)
    response.status_code = 200
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

# DELETE /clips/<id>
# Remove clip from storage
@app.route(VERSION_01_API + '/clips/<id>', methods=['DELETE'])
def remove_clip_by_id(id):
    return builder.remove_clip_by_id_response_data(id)

# POST /clips
# Add new video with form data. (Will also include a video file).
@app.route(VERSION_01_API + '/clips', methods=['POST'])
def add_new_clip():
    return builder.add_new_clip_response_builder(request)

# PATCH /clips/<clip_id>
# Update clip content/metadata.
@app.route(VERSION_01_API + '/clips/<id>', methods=['PATCH'])
def update_clip_content(id):
    print("update meta data called")
    return builder.update_clip_content_by_id_response_data(id)

# GET /comments/<clip_id>
# Get user comment for a clip
@app.route(VERSION_01_API + '/comments/<id>', methods=['GET'])
def get_user_comment_for_clip(id):
    return builder.get_comment_by_id(id)

# POST /comments/<clip_id>/<user_id>
# Add new comment to clip - Only able to have one?
@app.route(VERSION_01_API + '/comments/<clip_id>/<user_id>', methods=['POST'])
def add_new_comment_to_clip(clip_id, user_id):
    return builder.add_comment_to_clip_response_builder(request, clip_id, user_id)

# PATCH /comments/<clip_id>/<user_id>
# Update comment value
@app.route(VERSION_01_API + '/comments/<id>', methods=['PATCH'])
def update_comment_by_user_id(id):
    return builder.update_comment_by_id(id)

# DELETE /comments/<clip_id>/<user_id>
# Remove comment from clip
@app.route(VERSION_01_API + '/comments/<id>', methods=['DELETE'])
def remove_comment_by_user_id(id):
    return builder.remove_comment_by_id(id)

# GET /search
# Search for video by title
@app.route(VERSION_01_API + '/search/<search_term>', methods=['GET'])
def search_by_title(search_term):
    return builder.search_by_title(search_term)

@app.route(VERSION_01_API + '/video_to_text/<clip_id>', methods=['POST'])
def content_mod_testing(clip_id):
    """performs continuous speech recognition with input from an audio file"""
    # <SpeechContinuousRecognitionWithFile>
    text_results = []
    print(request.files.getlist("audio_file"))
    for file in request.files.getlist('audio_file'):
        try:
            file.save(file.filename)
            text_results = builder.convert_video_to_text_helper(file.filename)
        except:
            os.remove(file.filename)
            print("Exception : File format not supported.")
            response = jsonify({"message" : "File Format Not Allowed, Please Ensure Format is .mov", "error" : "Forbidden"})
            response.status_code = 403
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        os.remove(file.filename)
        print("File has been removed for local storage. {}".format(file.filename))

    print(f"Transcript = {text_results}")
    builder.add_text_to_video_db(' '.join(text_results), clip_id)
    response = jsonify({"transcript" : text_results})
    response.status_code = 200
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

if __name__ =='__main__':
    app.run(debug = True)
