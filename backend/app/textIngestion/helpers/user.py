import requests



class User:
    # session: session found in the user's cookies in local storage

    def __init__(self, session):
        self.session = session

    

    def setSession(self, session):
        self.session = session

    



