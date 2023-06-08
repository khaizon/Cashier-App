import { Dispatch, FC, SetStateAction, useContext, useEffect, useState } from 'react';

import './LoginCard.css';
import googleAPIGetRangeValues from '../../spreadsheets/utils';
import { SheetContext } from '../../App';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

type LoginCardProps = {
  setCategoryItems: Dispatch<SetStateAction<CategoryItem[]>>;
  setTokenClient: Dispatch<SetStateAction<google.accounts.oauth2.TokenClient | undefined>>;
  setSheetName: Dispatch<SetStateAction<string>>;
};

const LoginCard: FC<LoginCardProps> = ({ setCategoryItems, setTokenClient, setSheetName }) => {
  const [gapiInited, setGapiInited] = useState(false);
  const [gsiInited, setGsiInited] = useState(false);
  const sheetName = useContext(SheetContext);

  const handleAuth = () => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_CLIENT_ID,
      scope: SCOPES,
      callback: async (resp) => {
        if (resp.error !== undefined) {
          throw resp;
        }
        googleAPIGetRangeValues(sheetName, (items) => setCategoryItems(items));
      },
    });
    setTokenClient(client);
    client.requestAccessToken({ prompt: '' });
  };

  useEffect(() => {
    async function intializeGapiClient() {
      await gapi.client.init({
        apiKey: import.meta.env.VITE_API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      });
      setGapiInited(true);
    }
    const gsiScript = document.createElement('script');
    gsiScript.src = 'https://accounts.google.com/gsi/client';
    gsiScript.async = true;
    gsiScript.onload = () => setGsiInited(true);
    document.body.appendChild(gsiScript);

    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.onload = () => gapi.load('client', intializeGapiClient);
    document.body.appendChild(gapiScript);
  }, [setCategoryItems, setTokenClient]);

  return (
    <form
      id="loginCard"
      onSubmit={(e) => {
        e.preventDefault();
        gsiInited && gapiInited && handleAuth();
      }}
    >
      enter sheet name ↓
      <input type="text" placeholder="maomao" value={sheetName} autoFocus onChange={(e) => setSheetName(e.target.value)} />
      <button>weee!</button>
    </form>
  );
};

export default LoginCard;
