import { useEffect, useState } from "react";
import { Alert, Button, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import { addCycle, addSymptom, chat, getInsights, listCycles, listSymptoms, login, register } from "./src/api";
import Ask from "./src/screens/Ask";
import Chat from "./src/screens/Chat"; // <- create if you don't have it
const Tab = createBottomTabNavigator();

export default function App() {
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("Passw0rd!");
  const [cycles, setCycles] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [insights, setInsights] = useState(null);
  const [prompt, setPrompt] = useState("Give me a gentle self-care tip for PMS");
  const [chatAns, setChatAns] = useState("");


  const load = async () => {
    try {
      const [c, s, i] = await Promise.all([listCycles(), listSymptoms(), getInsights()]);
      setCycles(c); setSymptoms(s); setInsights(i);
    } catch (e) {
      console.log("LOAD ERROR", e?.response?.data || e.message);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={{ flex:1, padding:16 }}>
      <ScrollView>
        <Text style={{ fontSize:22, fontWeight:"600" }}>Menstrual App (Dev)</Text>

        <Text>Email</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none"
          style={{ borderWidth:1, padding:8, borderRadius:8 }} />

        <Text>Password</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry
          style={{ borderWidth:1, padding:8, borderRadius:8 }} />

        <View style={{ flexDirection:"row", marginTop:12 }}>
          <Button title="Register" onPress={async () => { await register(email, password); Alert.alert("Registered"); }} />
          <Button title="Login" onPress={async () => { await login(email, password); Alert.alert("Logged in"); await load(); }} />
        </View>

        <Button title="Add Period (today)" onPress={async () => {
          const today = new Date().toISOString().slice(0,10);
          await addCycle(today, 3, "app demo");
          await load();
        }} />

        <Button title="Add Symptom (tomorrow: cramps 2)" onPress={async () => {
          const d = new Date(Date.now()+24*3600*1000).toISOString().slice(0,10);
          await addSymptom(d, "cramps", 2, { mood:"low" }, "demo");
          await load();
        }} />

        <Text style={{ fontSize:18, marginTop:16 }}>Insights</Text>
        <Text selectable>{JSON.stringify(insights, null, 2)}</Text>

        <Text style={{ fontSize:18, marginTop:16 }}>Cycles</Text>
        <Text selectable>{JSON.stringify(cycles, null, 2)}</Text>

        <Text style={{ fontSize:18, marginTop:16 }}>Symptoms</Text>
        <Text selectable>{JSON.stringify(symptoms, null, 2)}</Text>

        <Text style={{ marginTop:16 }}>Chat prompt</Text>
        <TextInput value={prompt} onChangeText={setPrompt}
          style={{ borderWidth:1, padding:8, borderRadius:8 }} />
        <Button title="Ask" onPress={async () => {
          const res = await chat(prompt);
          setChatAns(res?.answer || JSON.stringify(res));
        }} />
        <Text style={{ marginTop:8 }} selectable>{chatAns}</Text>
        <NavigationContainer>
          <Tab.Navigator screenOptions={{ headerTitleAlign:"center" }}>
            <Tab.Screen name="Ask" component={Ask} />
            <Tab.Screen name="Chat" component={Chat} />
          </Tab.Navigator>
        </NavigationContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
