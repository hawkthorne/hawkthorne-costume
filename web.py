import urllib
import os
from flask import Flask, render_template, redirect, request

app = Flask(__name__)

baseurl = ("https://github.com/kyleconroy/hawkthorne-journey/raw/"
           "master/src/images/")
characters = ['jeff', 'troy', 'annie', 'britta', 'shirley', 'pierce', 'abed']

@app.route("/<character>")
@app.route("/<character>/<path:in_url>")
def index_with_url(character, in_url=''):
    if character.lower() not in characters:
        return "I don't know who that character is", 404

    url = urllib.unquote(in_url)
    if url and not url.startswith("https://") and not url.startswith("http://"):
        url = "http://" + url

    sprite = baseurl + character + ".png"

    return render_template("index.html", source=url, characters=characters,
                           character=character, original=sprite)


@app.route("/<character>", methods=['POST'])
@app.route("/<character>/<path:in_url>", methods=['POST'])
def fallback(character, in_url=None):
    character = request.form.get('character', 'abed')
    costume = request.form.get('url', '')

    url = "/" + character

    if costume:
        url += "/{}".format(urllib.quote(costume))

    return redirect(url)


@app.route("/")
def index():
    return redirect("/abed")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

