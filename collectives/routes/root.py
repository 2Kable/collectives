""" Module for miscaleneous routes

This modules contains the root Blueprint
"""
from flask import redirect, url_for, Blueprint
from flask import current_app, render_template
from flask_login import current_user, login_required
from ..forms.auth import LegalAcceptation
from ..utils.time import current_time
from ..models import db

blueprint = Blueprint("root", __name__)


@blueprint.route("/")
def index():
    """ Route for root: redirected to event """
    return redirect(url_for("event.index"))


@blueprint.route("/legal")
def legal():
    """ Route to display site legal terms """
    return render_template(
        "legal.html", conf=current_app.config, form=LegalAcceptation()
    )


@blueprint.route("/legal/accept", methods=["POST"])
@login_required
def legal_accept():
    """ Route to accept site legal terms """
    current_user.legal_text_signature_date = current_time()
    db.session.add(current_user)
    db.session.commit()
    return redirect(url_for("root.legal"))
