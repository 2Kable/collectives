import requests
from typing import List
from collectives.models.user import UserModelMixin as User

'''
Manage communication with Whatsapp API Layer
We are using devlikeapro/whatsapp-http-api api layer
link: https://github.com/devlikeapro/whatsapp-http-api
Documentation: https://waha.devlike.pro/docs/overview/introduction/

'''
class WhatsappApi:    
    '''
    Parameters:
        apiUrl (str): The api layer url
        sessionName (str): The session name of the api layer if not default
    '''    
    def __init__(self, apiUrl: str, sessionName: str = 'default'):
        self.apiUrl = apiUrl + '/api'
        self.sessionName = sessionName
    
    '''
    Send a Whatsapp message to the given user
    cf: https://waha.devlike.pro/docs/how-to/send-messages/
    '''
    def send_message(self, user: User, message: str) -> None:
        payload = {
            "chatId": f'{self.get_user_number(user)}@c.us',
            "text": self,
            "session": self.sessionName,
        }
        requests.post(f'{self.apiUrl}/sendText', json=payload)

    '''
    Create a group and set an admin
    cf: https://waha.devlike.pro/docs/how-to/send-messages/
    '''
    def create_group(self, admin: User, users: List[User], groupName: str) -> None:
        # Invite all participants
        createPayload = {
            "name": groupName,
            "participants": map(lambda user: {"id": self.get_user_number(user)} , users + admin)
        }
        res = requests.post(f'{self.apiUrl}/{self.sessionName}/groups', json=createPayload)
        # Set the admin
        groupId = res.gid.user
        adminPayload = {
            "participants": [
                { 
                    "id": self.get_user_number(admin) 
                }
            ]
        }
        res = requests.post(f'{self.apiUrl}/{self.sessionName}/groups/${groupId}/admin/promote', json=adminPayload)

    def get_user_number(user: User) -> str:
        phoneNumber = ''.join([n for n in user.phone if n.isdigit()])
        return f'{phoneNumber}@c.us'