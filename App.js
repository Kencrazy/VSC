import { View,Text,FlatList,TouchableOpacity,Keyboard,Dimensions,Image,StyleSheet,ImageBackground,TouchableWithoutFeedback,TextInput, ScrollView,KeyboardAvoidingView,ActivityIndicator,Platform, SafeAreaView, Alert,Linking,Modal, Button } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BackImage from "./components/BackImage";
import { ResizeMode, Video } from "expo-av";
import { SelectList } from 'react-native-dropdown-select-list'
import { initializeApp } from "firebase/app";
import { getAuth,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut, } from "firebase/auth";
import { getFirestore,collection,doc,setDoc,getDoc,updateDoc,where,query,getDocs,Timestamp,orderBy,onSnapshot,addDoc } from "firebase/firestore";
import { getStorage,ref,uploadBytesResumable,getDownloadURL,uploadBytes } from "firebase/storage";
import * as ImagePicker from "expo-image-picker"
import React,{useState,useRef,useEffect,useCallback,useLayoutEffect} from "react"
import { CameraView,Camera } from "expo-camera";
import axios from "axios";
import { speak,isSpeakingAsync,stop } from "expo-speech";
import ChatBubble from "./chatbubble";
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import ReactNativeModal from "react-native-modal";
import { GiftedChat } from "react-native-gifted-chat";

const Stack = createNativeStackNavigator()

async function GetUser(id) {
  const docRef = doc(db, "schoolalert", id);
  let data_container;

  try {
    const docSnap = await getDoc(docRef);
    data_container = docSnap.data();
  } catch (error) {
    console.warn(error);
  }

  return data_container;
}

async function getSchools() {
  const schoolsArray = [];

  try {
    const schoolsCollection = collection(db, 'schoolalert');
    const querySnapshot = await getDocs(schoolsCollection);

    // Log the number of documents retrieved

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Log the document data

      // Check if the position is 'school' and username exists
      if (data.position === 'school' && data.username) {
        schoolsArray.push({ key: doc.id, value: data.username });
      } else {
      }
    });
  } catch (error) {
    console.error("Error fetching schools: ", error);
  }
  
  return schoolsArray;
}

async function GetDocIDFromUserID(violator_id){
  const q = query(collection(db,"schoolalert"))
  const querySnapshot = await getDocs(q);
  let documentId =""

  querySnapshot.forEach((doc) => {
    const userData = doc.data();
    // console.log(userData);
  //   console.log(doc.id);
    if (Number(userData.id) === Number(violator_id)) {
      documentId = doc.id;
      // console.log('This is the owner of the car:', plateNumber);
      // console.log(doc.id);

    }
  });
  return documentId;
}

async function getImageFromStorage(id,name) {
  const imagePath = `${id}/${name}.jpg`
  try {
    const imageRef = ref(storage, imagePath); // Create a reference to the image
    const imageUrl = await getDownloadURL(imageRef); // Get the download URL
    return imageUrl; // Return the image URL
  } catch (error) {
    console.error("Error getting image URL:", error); // Handle errors
    return null;
  }
}

const styles = StyleSheet.create({
  record:{
    padding:20,
    borderWidth:8,
    justifyContent:"center",
    borderRadius:10
  },
  school:{
    width:110,
    height:110,
    borderRadius:10
  },
  school_text:{
    marginTop:15,
    color:"white",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10,
    fontSize:25,
    fontWeight:"bold"
  },
  report:{
    justifyContent:"space-between",
    flexDirection:"row",
    width:"100%",
    marginTop:30
  },
  small_box:{
    backgroundColor:"white",
    borderRadius:10,
    width: Dimensions.get("screen").width*0.45,
    padding:15
  },
  monthDisplay:{
    color:"#31279c",
    fontSize:25,
    fontWeight:400
  },
  day:{
    fontWeight:"bold",
    color:"#31279c",
    fontSize:35
  },
  formattedDate:{
    fontSize:15,
    marginTop:10
  },
  timeOfDay:{
    fontWeight:"bold",
    color:"#31279c",
    fontSize:16
  },
  formattedTime:{
    fontSize:15
  },
  error:{
    width:50,
    height:50,
    backgroundColor:"#f70a22",
    alignItems:"center",
    justifyContent:"center",
    borderRadius:25
  },
  number:{
    fontWeight:"bold",
    fontSize:20,
    color:"white"
  },
  alert:{
    marginTop:10,
    color:"#f70a22",
    fontWeight:"bold",
    fontSize:15,
    width:"80%"
  },
  button:{
    marginTop:10,
    backgroundColor:"orange",
    width:"85%",
    padding:5,
    alignItems:"center",
    borderRadius:6,
  },
  text_button:{
    color:"white",
    fontWeight:"bold"
  },
  large_box:{
    marginTop:15,
    backgroundColor:"white",
    flexDirection:"row",
    width:"100%",
    padding:15,
    borderRadius:10
  },
  avatar:{
    width:110,
    height:110,
    borderRadius:55
  },
  private:{
    marginLeft:15,
    top:20,
    width:"40%"
  },
  name:{
    color:"#31279c",
    fontWeight:"bold",
    fontSize:16
  },
  grade:{
    fontSize:16,
    marginTop:3
  },
  notification:{
    backgroundColor:"white",
    width:"90%",
    alignSelf:"center",
    padding:10,
    borderRadius:10,
    // iOS shadow properties
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // Android shadow property
    elevation: 5,
  },
  boxes:{
    flexDirection:"row",
    alignItems:"center"
  },
  violate_content:{
    marginLeft:10
  },
  violate:{
    fontWeight:"bold",
    fontSize:17
  },
  date:{
    fontSize:15,
    top:1
  },
  input:{
    marginTop:15,
    backgroundColor:"white",
    width:"90%",
    borderRadius:10,
    borderWidth:0.5,
    padding:13
  },
  text:{
    marginTop:15,
    backgroundColor:"white",
    width:"100%",
    padding:13,
    borderRadius:10,
    borderWidth:0.5
  }
})

//firebase
const firebaseConfig = {
  apiKey: "AIzaSyCPmPPA2AI8Dq3CzGUH-zusZ0kJSLsRNE0",
  authDomain: "chat-app-186d1.firebaseapp.com",
  projectId: "chat-app-186d1",
  storageBucket: "chat-app-186d1.appspot.com",
  messagingSenderId: "835388868008",
  appId: "1:835388868008:web:9ac37b128274c8bcbc099d",
  measurementId: "G-YQY2SFJ323"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

//authentication
function Login({navigation}){
  const [id,setID]=useState()
  const [password,setPassword]=useState()

  const handleLoginButton = async()=>{
    try{
      const response = await handleLogin({id,password})
      if(response[1]=="parent"){
        navigation.navigate("ParentRoute",{id:response[0]})
      } else if(response[1]=="school"){
        navigation.navigate("SchoolRoute",{id:response[0]})
      } else{
        navigation.navigate("PoliceRoute",{id:response[0]})
      }
      
    } catch(err){
      Alert.alert("Wrong password or id")
    }
  }
  return(
    <SafeAreaView style={{alignItems:"center",flex:1}}>
      <View style={{alignItems:"center",marginTop:80}}>
        <Text style={{fontWeight:"600",fontSize:40}}>Welcome Back</Text>
        <Text>Enter your credential for login</Text>
      </View>

      <TextInput onChangeText={id => setID(id)} placeholder="Mã học sinh/công việc" placeholderTextColor={"black"} style={{marginTop:200,width:"90%",backgroundColor:"rgba(219, 170, 156,0.5)",padding:18,borderRadius:8}}/>
      <TextInput onChangeText={password=>setPassword(password)} placeholder="Mật khẩu" placeholderTextColor={"black"} style={{marginTop:15,width:"90%",backgroundColor:"rgba(219, 170, 156,0.5)",padding:18,borderRadius:8}}/>

      <TouchableOpacity onPress={handleLoginButton} style={{marginTop:100,width:"60%",backgroundColor:"#c93508",padding:15,alignItems:"center",borderRadius:20}}>
        <Text style={{color:"white",fontWeight:"500",fontSize:16}}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={()=>navigation.navigate("Signup")} style={{marginTop:10}}>
        <Text>Don't have an account? Signup</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

function Signup({navigation}){
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchools = async () => {
      const schoolsList = await getSchools(); // Wait for the data to be fetched
      setSchools(schoolsList);
      setLoading(false);
    };

    fetchSchools();
  }, [selected]);
  const classes = [
    {key:"parent",value:"Phụ huynh"},
    {key:"school",value:"Trường học"},
    {key:"police",value:"Cảnh sát"}
  ]
  const [selected,setSelected]=useState()
  const [id,setID]=useState()
  const [school,setSchool]=useState()
  const [username,setUsername]=useState()
  const [password,setPassword]=useState()
  const [checkedpassword,setCheckedPassword]=useState()
  
  
  const handleSignupButton = async()=>{
    if(password == checkedpassword && selected){
      await handleSignup({id,username,position:selected,school,password})
      navigation.navigate("Login")
    } else{
      Alert.alert("Wrong password or No Position")
    }
  }
  
  return(
    <SafeAreaView style={{alignItems:"center",flex:1}}>
      <View style={{alignItems:"center",marginTop:80}}>
        <Text style={{fontWeight:"500",fontSize:40}}>Sign up</Text>
        <Text>Create your account</Text>
      </View>
      <SelectList 
        setSelected={setSelected} 
        data={classes} 
        save="key"
        boxStyles={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
          width: "90%",
          marginTop: 20,
        }}
        maxHeight={120}
        placeholder={"Position"}
      />
      {selected== "parent" &&  
        <SelectList 
          setSelected={setSchool} 
          data={schools} 
          save="key"
          boxStyles={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
            width: "90%",
            marginTop: 20,
          }}
          placeholder={"Chọn trường"}
        />
      }
      <TextInput onChangeText={id => setID(id)} placeholder="Mã CCCD" placeholderTextColor={"black"} style={{marginTop:50,width:"90%",backgroundColor:"rgba(219, 170, 156,0.5)",padding:18,borderRadius:8}}/>
      <TextInput onChangeText={username=>setUsername(username)} placeholder="Họ và tên học sinh/nhân viên/trường học" placeholderTextColor={"black"} style={{marginTop:15,width:"90%",backgroundColor:"rgba(219, 170, 156,0.5)",padding:18,borderRadius:8}}/>
      <TextInput onChangeText={password=>setPassword(password)} placeholder="Mật khẩu" placeholderTextColor={"black"} style={{marginTop:15,width:"90%",backgroundColor:"rgba(219, 170, 156,0.5)",padding:18,borderRadius:8}}/>
      <TextInput onChangeText={checkedpassword=>setCheckedPassword(checkedpassword)} placeholder="Nhập lại mật khẩu" placeholderTextColor={"black"} style={{marginTop:15,width:"90%",backgroundColor:"rgba(219, 170, 156,0.5)",padding:18,borderRadius:8}}/>

      <TouchableOpacity onPress={handleSignupButton} style={{marginTop:50,width:"60%",backgroundColor:"#c93508",padding:15,alignItems:"center",borderRadius:20}}>
        <Text style={{color:"white",fontWeight:"500",fontSize:16}}>Sign up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={()=>navigation.navigate("Login")} style={{marginTop:10}}>
        <Text>Already have an account? Login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}
//function

async function handleLogin({id=3,password}){
  try {
    const response = await signInWithEmailAndPassword(auth, `${id}@gmail.com`, password="12345678");
    // console.log(response);
    const currentUser = auth.currentUser;
    let position;
    if (currentUser) {
      const currentUserID = currentUser.uid;
      const userDocRef = doc(db, 'schoolalert', currentUserID);
      const res = await getDoc(userDocRef);
      position = res.data()
      // console.log("type", type.data());
    }
    let data = []
    data.unshift(position.position)
    data.unshift(currentUser.uid)

    return data;
  } catch (error) {
    console.log('Login Error:', error);
    return false;
  }
}

async function handleSignup({id,password,position,username,compliant,students,violation,history,school}){
  try{
    const response = await createUserWithEmailAndPassword(auth, `${id}@gmail.com`, password="12345678")
    const currentUser = auth.currentUser
    const userID = currentUser.uid
    const userDocRef = doc(db, 'schoolalert', userID);
    if(position=="police"){
      await setDoc(userDocRef,{
        username:username,
        position:position,
        id:id
      })
    } else if(position=="school"){
      await setDoc(userDocRef,{
        username:username,
        position:position,
        compliant:[],
        students:[],
        violation:[],
        id:id
      })
    } else{
      await setDoc(userDocRef,{
        username:username,
        position:position,
        history:[],
        school:school,
        id:id
      })

      const docSnap = await getDoc(doc(db,"schoolalert",school))
      const data = docSnap.data()
      const students = data.students
      const newStudents = [userID,...students]
      await setDoc(doc(db,"schoolalert",school),{
        students: newStudents
      })
    }
  } catch(err){
    console.log(err);
  }
}

function PoliceRoute({route}){
  const {id}=route.params
  return(
    <Stack.Navigator screenOptions={{headerShown:false}}>
      <Stack.Screen component={Police} name="PHome" options={{title:"Home"}} initialParams={{id}}/>
      <Stack.Screen component={FaceRecognition} name="Face" options={{title:"Nhận diện khuôn mặt",headerShown:true}} initialParams={{id:id}}/>
      <Stack.Screen component={PlateRecognition} name="Plate" options={{title:"Nhận diện biển số xe",headerShown:true}} initialParams={{id:id}}/>
      <Stack.Screen component={SendNotification} name="PSendNotification" options={{title:"Thông báo",headerShown:true}} initialParams={{policeID:id}}/>
    </Stack.Navigator>
  )
}

function SchoolRoute({route}){
  const {id}=route.params
  return(
    <Stack.Navigator screenOptions={{headerShown:false}}>
      <Stack.Screen component={School} name="SHome" options={{title:"Home"}} initialParams={{id:id}}/>
      <Stack.Screen component={Compliant} name="Rule" options={{title:"Cập nhật thỏa thuận",headerShown:true}} initialParams={{id:id}}/>
      <Stack.Screen component={SchoolSendNotification} name="SSendNotification" options={{title:"Thông báo",headerShown:true}} initialParams={{idSchool:id}}/>
      <Stack.Screen component={SchoolNotification} name="SNotification" options={{title:"Thông báo",headerShown:true}} initialParams={{id:id}}/>
      <Stack.Screen component={Chat} name="SChat" options={{title:"Chat Room",headerShown:true}} initialParams={{id}}/>
      <Stack.Screen component={Punish} name="Punish" options={{headerShown:false}} initialParams={{id:id}}/>
      <Stack.Screen component={Violation} name="Violation" options={{headerShown:false}} initialParams={{id:id}}/>
      <Stack.Screen component={FaceRecognition} name="Face" options={{title:"Nhận diện khuôn mặt",headerShown:true}} initialParams={{id:id}}/>
    </Stack.Navigator>
  )
}

function ParentRoute({route}){
  const {id}=route.params
  return(
    <Stack.Navigator>
      <Stack.Screen component={Parent} name="Home" options={{title:"Home",headerShown:false}} initialParams={{id}}/>
      <Stack.Screen component={Rule} name="Compliant" options={{title:"Thỏa thuận",headerShown:true}} initialParams={{id}}/>
      <Stack.Screen component={Notification} name="Notification" options={{title:"Thông báo",headerShown:true}} initialParams={{id}}/>
      <Stack.Screen component={Chat} name="PaChat" options={{title:"Chat Room",headerShown:true}} initialParams={{id}}/>
      <Stack.Screen component={Punish} name="Punish" options={{headerShown:false}} initialParams={{id:id}}/>
      <Stack.Screen component={Violation} name="Violation" options={{headerShown:false}} initialParams={{id:id}}/>
      <Stack.Screen component={UpdateRule} name="Update" options={{title:"Cập nhật luật ATGT",headerShown:true}} initialParams={{id}}/>
    </Stack.Navigator>
  )
}

//chat
function Chat({route,navigation}){
  const [position,setPosition]=useState()

      useEffect(()=>{
        // const user_info = await GetUser(id)

        createRoomIfNoExisted()
        const docRef = doc(db,"rooms",roomID)
        const messageRef = collection(docRef,"messages")
        const q = query(messageRef,orderBy("createdAt","desc"))

        let unsub = onSnapshot(q,(snapshot)=>{
            let allMessages = snapshot.docs.map(doc=>{
                return doc.data()

            })
            // setMessages([...allMessages])
            const mappedMessages = allMessages.map((message) => {
                const { _id, text, createdAt } = message.messages[0];
                const user = message.user;
                return {
                  _id,
                  text,
                  createdAt,
                  user,
                };
              });
              setMessages(mappedMessages);
        })
        return unsub
    },[])
    
      // console.log(position);
      useEffect(() => {
        const getData = async ()=>{
            const user_info = await GetUser(id)
              
              // console.log(user_info.username);
              // console.log(user_info.position)
              setPosition(user_info)
             

              

      } 
      getData()
        
      }, []);
    const {id,id2}=route.params
    const [messages, setMessages] = useState([])
    const handlePress = async()=>{
      await Linking.openURL('https://newtocodenow.github.io/ZegoCloud')
      console.log("j")
    }
    // console.log(item.id);
    useLayoutEffect(() => {
      
      navigation.setOptions({
        headerRight: () => (
            <TouchableOpacity style={{padding:5}} onPress={handlePress}>
              <Image source={require("./assets/phone.png")} />
            </TouchableOpacity> 
        ),
      });
    }, [id]);


    // console.log(messages);

//   useEffect(() => {
//     setMessages([])
//   }, [])

  const createRoom = (id,id2)=>{
    const sortedID = [id,id2].sort()
    const room = sortedID.join('-')
    return room
  }
  const roomID = createRoom(id,id2)

  const createRoomIfNoExisted = async ()=>{
    // let roomID = roomID
    await setDoc(doc(db,"rooms",roomID),{
        roomID,
        createdAt: Timestamp.fromDate(new Date())   
    })
  }


  const onSend = useCallback(async (messages = []) => {
    // setMessages(previousMessages =>
    //   GiftedChat.append(previousMessages, messages),
    // )
    

        const docRef = doc(db,"rooms",roomID)
        const messageRef = collection(docRef,"messages")

        const add = await addDoc(messageRef,{
            messages,
            user:{
                _id:id,
                name: "Ẩn danh",
                avatar:"https://cdn-icons-png.flaticon.com/32/3135/3135715.png"
            },
            createdAt: new Date()
        })
    // console.log(add);
  }, [])
  // console.log(modal);   

  return (
    <View style={{flex:1}}>

    <GiftedChat
      messages={messages}
      onSend={messages => onSend(messages)}
      user={{
        _id: id,
      }}
    />
    </View>
  )
}
//biên bản vi phạm
function Violation({navigation,route}){
  const {id2,information}=route.params
  const [student,setStudent]=useState()
  const [police,setPolice]=useState()
  const [school,setSchool]=useState()
  const date = information.date.split("/")
  const time = information.time.split(":")
  useEffect(()=>{
    const getData = async ()=>{
        try{
            const user_info = await GetUser(information?.studentID)
            setStudent(user_info) 
            const police_info = await GetUser(id2)
            setPolice(police_info)      
            const school_info = await GetUser(user_info.school)
            setSchool(school_info)       
                        
        } catch(err){
            console.error(err)
        }
    } 
    getData()
},[])

return(
  <ScrollView style={{backgroundColor:"white",flex:1,paddingTop:35,paddingHorizontal:10}}>
      <View style={{flexDirection:"row",justifyContent:"space-between"}}>
          <Text style={{fontSize:11}}>Số:....BB-VPHC</Text>
          <View style={{alignItems:"center"}}>
              <Text style={{fontSize:12,fontWeight:"bold"}}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</Text>
              <Text style={{fontSize:12,fontWeight:"bold"}}>Độc lập - Tự do - Hạnh phúc</Text>
              <View style={{borderWidth:1,width:150,marginTop:3}}></View>
          </View>
      </View>

      <Text style={{color:"red",fontSize:20,fontWeight:"bold",textAlign:"center",marginTop:30}}>BIÊN BẢN VI PHẠM HÀNH CHÍNH</Text>
      <Text style={{fontSize:11,fontWeight:"bold",textAlign:"center"}}>Trong lĩnh vực giao thông đường bộ, đường sắt</Text>

      <Text style={{fontSize:13,fontWeight:"bold",marginTop:20}} >Hồi {time[0]} giờ {time[1]} phút, ngày {date[0]} tháng {date[1]} năm {date[2]}, tại Đà Nẵng</Text>

      <View style={{marginVertical:10}}>
          <Text style={{fontSize:13,fontWeight:"bold"}}>Tôi: {information.type == 2 ? police?.username : police?.name}</Text>
          <Text style={{fontSize:13,fontWeight:"bold",marginTop:10}}>Chức vụ: {police?.job ? police?.job : "CSGT"}</Text>
      </View>
      <Text style={{fontSize:13,fontWeight:"bold"}}>Tiến hành lập biên bản VPHC trong lĩnh vực giao thông đường bộ đối với</Text>


      <Text style={{fontSize:13,fontWeight:"bold",marginTop:10}}>Anh/chị :{student?.username} </Text>

    
      <Text style={{fontSize:13,fontWeight:"bold",marginTop:10}}>Địa chỉ: 12 Trần Đăng Ninh, quận Hải Châu, thành phố Đà Nẵng</Text>

      {information.explain && (
      <Text style={{fontSize:13,fontWeight:"bold",marginTop:10}}>Mô tả thời gian, nơi vi phạm: {information.explain}</Text>
      )}
      <Text style={{fontSize:13,fontWeight:"bold",marginTop:10}}>Nghề nghiệp(lĩnh vực hoạt động): Học Sinh</Text>
      <Text style={{fontSize:13,fontWeight:"bold",marginTop:10}}>Phương tiện sử dụng khi vi phạm: {information.plateNumber}</Text>

      
      <Text style={{fontSize:13,fontWeight:"bold",marginTop:10}}>Số điện thoại liên lạc:{student?.phoneNumber} </Text>


      <View style={{flexDirection:"row",marginTop:20}}>
          <Text style={{fontSize:13,fontWeight:"bold"}}>Đã có vi phạm hành chính: {information.violate}</Text>
      </View>

      <View style={{flexDirection:"row",justifyContent:"space-between",marginTop:20}}>
          <View style={{alignItems:"center"}}>
              <Text style={{fontSize:10,fontWeight:"bold"}}>CÁ NHÂN VI PHẠM HOẶC ĐẠI DIỆN TỔ CHỨC VI PHẠM</Text>
              <Text style={{fontSize:10,fontWeight:"bold"}}>(Ký tên, ghi rõ, chức vụ, họ và tên)</Text>
          </View>

          <View style={{alignItems:"center"}}>
              <Text style={{fontSize:10,fontWeight:"bold"}}>NGƯỜI LẬP BIÊN BẢN</Text>
              <Text style={{fontSize:10,fontWeight:"bold"}}>(Ký, ghi rõ họ tên)</Text>
              
          </View>
      </View>

      <TouchableOpacity onPress={()=>navigation.navigate("Punish",{id2:information?.policeID,information:information})}  style={{backgroundColor:"#E8ECF4",alignItems:"center",marginHorizontal:40,paddingVertical:20,borderRadius:10,marginTop:50}}>
                <Text>Thông báo cho người vi phạm</Text>
      </TouchableOpacity>
  </ScrollView>
)
}

//biên bản xử phạt
function Punish({navigation,route}){
  const {id2,information}=route.params
  const [student,setStudent]=useState()
  const [police,setPolice]=useState()
  const [school,setSchool]=useState()
  const date = information.date.split("/")
  const time = information.time.split(":")
  useEffect(()=>{
    const getData = async ()=>{
        try{
            const user_info = await GetUser(information?.studentID)
            setStudent(user_info) 
            const police_info = await GetUser(id2)
            setPolice(police_info)      
            const school_info = await GetUser(user_info.school)
            setSchool(school_info)       
                        
        } catch(err){
            console.error(err)
        }
    } 
    getData()
},[])

return(
  <ScrollView style={{backgroundColor:"white",flex:1,paddingTop:35,paddingHorizontal:10}}>
      <View style={{flexDirection:"row",justifyContent:"space-between"}}>
          <Text style={{fontSize:11}}>Số:....BB-VPHC</Text>
          <View style={{alignItems:"center"}}>
              <Text style={{fontSize:12,fontWeight:"bold"}}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</Text>
              <Text style={{fontSize:12,fontWeight:"bold"}}>Độc lập - Tự do - Hạnh phúc</Text>
              <View style={{borderWidth:1,width:150,marginTop:3}}></View>
          </View>
      </View>

      <Text style={{color:"red",fontSize:20,fontWeight:"bold",textAlign:"center",marginTop:30}}>BIÊN BẢN XỬ PHẠT</Text>
      <Text style={{fontSize:11,fontWeight:"bold",textAlign:"center"}}>Trong lĩnh vực giao thông đường bộ, đường sắt</Text>

      <Text style={{fontSize:13,fontWeight:"bold",marginTop:20}} >Hồi {time[0]} giờ {time[1]} phút, ngày {date[0]} tháng {date[1]} năm {date[2]}, tại Đà Nẵng</Text>

      <View style={{marginVertical:10}}>
          <Text style={{fontSize:13,fontWeight:"bold"}}>Tôi: {information.type == 2 ? police?.username : police?.name}</Text>
          <Text style={{fontSize:13,fontWeight:"bold",marginTop:10}}>Chức vụ: {police?.job ? police?.job : "CSGT"}</Text>
      </View>
      <Text style={{fontSize:13,fontWeight:"bold"}}>Tiến hành lập biên bản VPHC trong lĩnh vực giao thông đường bộ đối với</Text>


      <Text style={{fontSize:13,fontWeight:"bold",marginTop:10}}>Anh/chị :{student?.username} </Text>

    
      <Text style={{fontSize:13,fontWeight:"bold",marginTop:10}}>Địa chỉ: 12 Trần Đăng Ninh, quận Hải Châu, thành phố Đà Nẵng</Text>


      <Text style={{fontSize:13,fontWeight:"bold",marginTop:10}}>Nghề nghiệp(lĩnh vực hoạt động): Học Sinh</Text>
      <Text style={{fontSize:13,fontWeight:"bold",marginTop:10}}>Phương tiện sử dụng khi vi phạm: {information.plateNumber}</Text>

      
      <Text style={{fontSize:13,fontWeight:"bold",marginTop:10}}>Số điện thoại liên lạc:{student?.phoneNumber} </Text>


      <View style={{flexDirection:"row",marginTop:20}}>
          <Text style={{fontSize:13,fontWeight:"bold"}}>Đã có vi phạm hành chính: {information.violate}</Text>
      </View>

      <Text style={{fontSize:13,fontWeight:"bold",marginTop:10}}>Xử phạt: Ngày {information.date}, cậu học sinh {student?.username}, lớp 12/X trường {school?.username}, đã bị phát hiện vi phạm luật giao thông khi không đội mũ bảo hiểm trên đường đến trường. Sau khi ghi nhận vi phạm, nhà trường/CSGT đã lập biên bản xử phạt, trong đó nêu rõ hành vi không tuân thủ quy định về an toàn giao thông của em. CSGT/nhà trường đã thông báo đến phụ huynh,nhà trường mời họ đến trao đổi để thống nhất biện pháp giáo dục và giúp em hiểu rõ trách nhiệm khi tham gia giao thông.</Text>

      <View style={{flexDirection:"row",justifyContent:"space-between",marginTop:20}}>
          <View style={{alignItems:"center"}}>
              <Text style={{fontSize:10,fontWeight:"bold"}}>CÁ NHÂN VI PHẠM HOẶC ĐẠI DIỆN TỔ CHỨC VI PHẠM</Text>
              <Text style={{fontSize:10,fontWeight:"bold"}}>(Ký tên, ghi rõ, chức vụ, họ và tên)</Text>
          </View>

          <View style={{alignItems:"center"}}>
              <Text style={{fontSize:10,fontWeight:"bold"}}>NGƯỜI LẬP BIÊN BẢN</Text>
              <Text style={{fontSize:10,fontWeight:"bold"}}>(Ký, ghi rõ họ tên)</Text>
              
          </View>
      </View>
  </ScrollView>
)
}
//parent
function Notification({route,navigation}){
  const {id}=route.params
  const [data,setData]=useState()
  useEffect(() => {
    const fetchSchools = async () => {
      const schoolsList = await GetUser(id); // Wait for the data to be fetched
      setData(schoolsList);
    };

    fetchSchools();
  }, []);
  const notifications = [
    {type:"1", violate:"Không có bằng lái xe", date:"03/10/2024",image:"https://baolaichau.vn/uploaded/post/2022/12/19/1-5_1671420279499.jpg",video:"https://www.youtube.com/watch?v=sQ5xcwnnzE4&rco=1"},
    {type:"2", violate:"Không đội mũ bảo hiểm", date:"03/10/2024",image:"https://baolaichau.vn/uploaded/post/2022/12/19/1-5_1671420279499.jpg",video:"https://www.youtube.com/watch?v=sQ5xcwnnzE4&rco=1"},
  ]
  const video = useRef(null)
  const [status, setStatus] = useState({})
  const [selectedIndex,setSelectedIndex]=useState(null)
  const handleNotification = (index)=>{
    if(selectedIndex == null){
      setSelectedIndex(index)
    } else{
      setSelectedIndex(null)
    }
  }
  return(
    <View style={{flex:1}}>
      <FlatList
      data={data?.history}
      keyExtractor={(__,index)=>index.toString()}
      style={{flex:1,alignSelf:"center",marginTop:20,width:"100%"}}
      renderItem={({item,index})=>{
        return(
          <View style={styles.notification}>
            <TouchableOpacity style={styles.boxes} onPress={()=>handleNotification(index)}>
              <View style={[styles.error,{backgroundColor: item.type==1 ? "#3246a8" : "#f70a22"}]}>
                <Text style={[styles.number,{fontSize:30}]}>!</Text>
              </View>

              <View style={styles.violate_content}>
                <Text style={styles.violate}>{item.violate}</Text>
                <Text style={styles.date}>{item.date}</Text>
              </View>
            </TouchableOpacity>

            <Text style={{alignSelf:"center",fontSize:17}}>⧪</Text>
            {selectedIndex == index && 
              <View  style={{marginTop:5}}>
                {item?.type == 1 &&(
                  <Text style={styles.violate}>Mô tả: {item?.explain}</Text>
                )}
                <Text style={{fontSize:18}}>Hình ảnh vi phạm:</Text>
                <Image style={{width:"100%",height:Dimensions.get("screen").height*0.3,marginTop:5,borderRadius:8}} source={{uri:item?.image}}/>

                <Text style={{fontSize:18,marginTop:5}}>Video vi phạm</Text>
                <Video
                ref={video}
                style={{width:"100%",height:Dimensions.get("screen").height*0.3,marginTop:5,borderRadius:8}}
                source={{uri:item?.video}}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                onPlaybackStatusUpdate={status =>setStatus(()=>status)}/>

                <TouchableOpacity style={[styles.button,{width:"100%",padding:15}]} onPress={()=>status.isPlaying ? video.current.pauseAsync() : video.current.playAsync()}>
                  {item.video != null ?(
                    <Text style={styles.text_button}>
                      {status.isPlaying ? "Pause" : "Play"}
                    </Text>
                  ):(
                    <Text style={styles.text_button}>
                      Không tìm thấy video
                    </Text>
                  )}
                </TouchableOpacity>

                {item?.type == 1 ? (
                  <View>
                    <TouchableOpacity onPress={()=>navigation.navigate("PaChat",{id2:item?.schoolID})} style={[styles.button,{width:"100%",padding:15}]}>
                      <Text style={styles.text_button}>Liên hệ nhà trường</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={()=>navigation.navigate("Violation",{id2:item?.policeID,information:item})} style={[styles.button,{width:"100%",padding:15}]}>
                      <Text style={styles.text_button}>Biên bản vi phạm</Text>
                    </TouchableOpacity>
                  </View>
                ):(
                  <View>
                    <TouchableOpacity onPress={()=>navigation.navigate("Punish",{id2:item?.policeID,information:item})} style={[styles.button,{width:"100%",padding:15}]}>
                      <Text style={styles.text_button}>Biên bản xử phạt</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            }
          </View>
        )
      }}
      ItemSeparatorComponent={()=>(<View style={{marginTop:15}}></View>)}/>
    </View>
  )
}

function Parent({navigation,route}){
  const {id}=route.params
  const [data,setData]=useState()
  const [avatar,setAvatar]=useState()
  const [schoolavatar,setSchoolAvatar]=useState()
  const [schoolName,setSchoolName]=useState()
  const [rule,setRule]=useState()
  const [isVisible,setIsVisible]=useState(true)
  const [isVisisble2,setIsVisisble2]=useState(false)
  const [plate,setPlate]=useState()
  useEffect(()=>{
    const getData = async ()=>{
        try{
            const user_info = await GetUser(id)
            setData(user_info)            
            const school_info = await GetUser(user_info.school)
            setSchoolName(school_info.username)
            setRule(school_info.compliant)
            const avatar = await getImageFromStorage(id,"avatar")
            setAvatar(avatar)
            const schoolavatar = await getImageFromStorage(user_info.school,"schoolavatar")
            setSchoolAvatar(schoolavatar)                
        } catch(err){
            console.error(err)
        }
    } 
    getData()
},[id])
  
  const news = [
    {author:"Sức khỏe và đời sống",title:"25 phút cứu thanh niên 19 tuổi đa chấn thương do tai nạn giao thông",link:"https://suckhoedoisong.vn/25-phut-cuu-thanh-nien-19-tuoi-da-chan-thuong-do-tai-nan-giao-thong-169240626150038145.htm",key:0},
    {author:"Lao động",title:"Thiếu niên 16 tuổi lái xe máy gây tai nạn khiến 1 người ở Hải Phòng tử vong",link:"https://laodong.vn/xa-hoi/thieu-nien-16-tuoi-lai-xe-may-gay-tai-nan-khien-1-nguoi-o-hai-phong-tu-vong-1273612.ldo",key:1},
    {author:"Dân trí",title:"Thanh niên 17 tuổi lái xe máy gây tai nạn chết người",link:"https://dantri.com.vn/phap-luat/thanh-nien-17-tuoi-lai-xe-may-gay-tai-nan-chet-nguoi-20240722112235843.htm",key:2}
  ]
  const today = new Date()
  const month = today.getMonth()+1
  const day = String(today.getDate()).padStart(2, '0'); // Get day and pad with leading zero
  
  function monthNumberToString(monthNumber) {
    switch (monthNumber) {
        case 1: return "January";
        case 2: return "February";
        case 3: return "March";
        case 4: return "April";
        case 5: return "May";
        case 6: return "June";
        case 7: return "July";
        case 8: return "August";
        case 9: return "September";
        case 10: return "October";
        case 11: return "November";
        case 12: return "December";
        default: return null; // For invalid month numbers
      }
  }

  const monthDisplay = monthNumberToString(month)
  
  function formatDateAndTime(date) {
    // Format the date as DD/MM/YYYY
    const day = String(date.getDate()).padStart(2, '0'); // Get day and pad with leading zero
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const year = date.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    // Get hours and minutes
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');

    // Determine the time of day
    let timeOfDay;
    if (hours < 12) {
        timeOfDay = "Morning";
    } else if (hours < 17) {
        timeOfDay = "Afternoon";
    } else {
        timeOfDay = "Evening";
    }

    // Format time as HH:MM
    const formattedTime = `${String(hours).padStart(2, '0')}:${minutes}`;

    return {
        formattedDate,
        timeOfDay,
        formattedTime
    };
  }

  const result = formatDateAndTime(today)
  const notification = data?.history?.filter(item=>item.date === result.formattedDate).length
  // console.log(data?.history);
  const addPlate = async()=>{
    
    const docRef = doc(db,"schoolalert",id)
    if(!data?.plateNumber.includes(plate)){
      await updateDoc(docRef,{
        plateNumber:[plate,...data?.plateNumber]
      })
    }
    setIsVisisble2(false)
  }
  
  return(
    <ImageBackground source={require("./assets/background.jpg")} style={{flex:1,justifyContent:"center",alignItems:"center",paddingHorizontal:10}}>
      <ReactNativeModal isVisible={isVisisble2} onBackdropPress={()=>setIsVisisble2(false)} backdropOpacity={0.3}>
        <View style={{padding:15,backgroundColor:"white",borderRadius:10,height:"90%"}}>
          <Text style={{fontWeight:"500",fontSize:15}}>Vui lòng nhập biển số xe của bạn (không bắt buộc):</Text>
          <TextInput maxLength={10} style={[styles.input,{textAlign:"center",width:"100%",marginBottom:10,marginTop:5}]} onChangeText={text=>setPlate(text)} placeholder="43AXXXX" placeholderTextColor={"gray"}/>
          <Button title="Add" onPress={addPlate}/>

          <FlatList
          data={data?.plateNumber}
          contentContainerStyle={{alignItems:"center"}}
          renderItem={({item})=>{
            return(
              <Text style={{marginBottom:10,fontWeight:"500",fontSize:15}}>{item}</Text>
            )
          }}/>
        </View>
      </ReactNativeModal>

      <ReactNativeModal isVisible={isVisible} onBackdropPress={()=>setIsVisible(false)} backdropOpacity={0.3}>
        <View style={{padding:10,backgroundColor:"white",borderRadius:10,height:"90%"}}>
          <View style={{width:"100%",borderRadius:10,backgroundColor:"#29084a",padding:20}}>
            <Text style={{color:"white",fontWeight:"bold",fontSize:20}}>Thỏa thuận</Text>
            <Text style={{marginTop:5,color:"white"}}>Kính thưa Qúy phụ huynh</Text>
            <Text style={{marginTop:15,color:"white"}}>Nhằm đảm bảo an toàn và tuân thủ luật lệ giao thông cho học sinh, Trường {schoolName} cam kết cung cấp các quy định rõ ràng, minh bạch. Chúng tôi mong nhận được sự đồng hành và ủng hộ từ phía phụ huynh trong việc hướng dẫn và giám sát con em thực hiện tốt các quy định này.</Text>
          </View>

          <FlatList
      data={rule}
      keyExtractor={(item,index)=>index.toLocaleString()}
      showsVerticalScrollIndicator
      style={{width:"100%"}}
      renderItem={({item,index})=>(
        <TouchableOpacity style={{width:"100%",padding:20,borderRadius:16,shadowColor: '#000',shadowOffset: { width: 2, height: 0 },shadowOpacity: 0.3,shadowRadius: 4,elevation: 5,flexDirection:"row",alignItems:"center"}}>
          <Text style={{fontSize:30}}>{String(Number(index)+1).padStart(2,'0')}</Text>
          <Text style={{fontSize:14,marginLeft:10}}>{item}</Text>
        </TouchableOpacity>
      )}
      />
        </View>
      </ReactNativeModal>

      <Image style={styles.school} source={{uri:schoolavatar}}/>
      <Text style={styles.school_text}>{schoolName}</Text>

      <View style={styles.report}>
        <TouchableOpacity onPress={()=>navigation.navigate("Update")} style={[styles.small_box, { alignItems: "center" }]}>
            <Image style={{ width: 90, height: 90, marginTop: 10 }} source={require("./assets/robot.png")} />
            <Text style={{ fontWeight: "bold", fontSize: 16, marginTop: 15 }}>Cập nhật luật ATGT</Text>
        </TouchableOpacity>

        <View style={styles.small_box}>
          <View style={styles.error}><Text style={styles.number}>{notification}</Text></View>
          <Text style={styles.alert}>You have {notification} new alert!</Text>
          <TouchableOpacity onPress={()=>navigation.navigate("Notification")} style={styles.button}>
            <Text style={styles.text_button}>Go to Notification</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={()=>setIsVisisble2(true)} style={styles.large_box}>
        <Image style={styles.avatar} source={{uri:avatar}}/>

        <View style={styles.private}>
          <Text style={styles.name}>{data?.username}</Text>
          <Text style={styles.grade}>Lớp: 12/X</Text>

          <View style={{flexDirection:"row",alignItems:"center",marginTop:5}}>
            <View style={{flexDirection:"row",alignItems:"center"}}>
              <View style={[styles.error,{width:20,height:20,borderRadius:10}]}>
                <Text style={[styles.number,{fontSize:15}]}>!</Text>
              </View>

              <Text style={{fontSize:17,fontWeight:400,marginLeft:5}}>{data?.history.filter(report=>report.type==2).length}</Text>
            </View>

            <View style={{flexDirection:"row",alignItems:"center", marginLeft:20}}>
              <View style={[styles.error,{width:20,height:20,borderRadius:10,backgroundColor:"#3246a8"}]}>
                <Text style={[styles.number,{fontSize:15}]}>!</Text>
              </View>

              <Text style={{fontSize:17,fontWeight:400,marginLeft:5}}>{data?.history.filter(report=>report.type==1).length}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <View style={{marginTop:15}}>
        <FlatList
        data={news}
        keyExtractor={(__,index)=>index.toString()}
        style={{maxHeight:150}}
        horizontal
        showsHorizontalScrollIndicator={true}
        pagingEnabled
        scrollEventThrottle={16}

        renderItem={({item,index})=>{
          return(
            <View>
              <BackImage index={index} item={item}/>
            </View>
          )
        }}/>
      </View>
    </ImageBackground> 
  )
}

function Rule(){
  const rule = [
    "Cấm đi xe máy phân khối lớn (>50cc) cảnh báo 1 lần",
    "Không đội mũ bảo hiểm cảnh báo 1 lần",
    "Cảnh báo lần 1: Yêu cầu phụ huynh thu xe máy",
    "Cảnh báo lần 2: Hạ hành kiểm, hạ bậc thi đua của lớp",
    "Cảnh báo lần 3: Đình chỉ 1 tháng",
    "Cảnh báo lần 4: Đuổi học"
  ]
}
//police
function SendNotification({navigation,route}) {
  const {policeID}= route.params
  const today = new Date()
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      const schoolsList = await getSchools(); // Wait for the data to be fetched
      setSchools(schoolsList);
      setLoading(false);
    };

    fetchSchools();
  }, []);

  function formatDateAndTime(date) {
    // Format the date as DD/MM/YYYY
    const day = String(date.getDate()).padStart(2, '0'); // Get day and pad with leading zero
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const year = date.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    // Get hours and minutes
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const second = date.getSeconds()

    // Determine the time of day
    let timeOfDay;
    if (hours < 12) {
        timeOfDay = "Morning";
    } else if (hours < 17) {
        timeOfDay = "Afternoon";
    } else {
        timeOfDay = "Evening";
    }

    // Format time as HH:MM
    const formattedTime = `${String(hours).padStart(2, '0')}:${minutes}:${second}`;

    return {
        formattedDate,
        timeOfDay,
        formattedTime
    };
  }

  const result = formatDateAndTime(today)

  const [selected, setSelected] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [hasAudioPermission, setHasAudioPermission] = useState(null);
  const [hasCameraPermission, setHasCameraPermission] =useState(null);
  const [record, setRecord] = useState(null);
  const [isRecording,setIsRecording]=useState(false)
  const [camera,setCamera]=useState(false)
  const cameraRef = useRef(null)
  const [id,setID]=useState()
  const [violator,setViolator]=useState()
  const [violatorID,setViolatorID]=useState()
  const [violate,setViolate]=useState()
  const [plateNumber,setPlateNumber]=useState()
  const [search,setSearch]=useState()

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');
const audioStatus = await Camera.requestMicrophonePermissionsAsync();
      setHasAudioPermission(audioStatus.status === 'granted');
})();
  }, []);

  useEffect(()=>{
    async function getData(){
      if(id){
        const userID = await GetDocIDFromUserID(id)
        const user_info = await GetUser(userID)
        
        setViolator(user_info.username)
        setViolatorID(userID)
      }
    }

    getData()
  },[id])


  // Take photo function
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } else {
      console.log('Camera permission not granted');
    }
  };
  
  const handleRecord = async () => {
    if (camera) {
      await cameraRef.current?.stopRecording();

      setTimeout(()=>{
        setCamera(false);
        setIsRecording(false)
      },1000)
      // return;
    }
    setCamera(true);
    const video = await cameraRef.current?.recordAsync();
    setRecord(video.uri)
  };

  if(isRecording){
    return(
      <CameraView ref={cameraRef} mode="video" style={{flex:1}}>
        <TouchableOpacity onPress={handleRecord}  style={[styles.error,{backgroundColor:"white",width:60,height:60,borderRadius:30,alignItems:"center",justifyContent:"center",position:"absolute",bottom:50,right:173}]}>
          <View style={styles.error}/>
        </TouchableOpacity>
      </CameraView>
    )
  }

  const handleNotification = async()=>{
    if(violatorID && selected && imageUri && record && violate && plateNumber){
      const user_info = await GetUser(violatorID)
      const school_info = await GetUser(selected)
      setLoading(true)
  
      const history = user_info.history
      const violation = school_info.violation

      const userRef = doc(db,"schoolalert",violatorID)
      const schoolRef = doc(db,"schoolalert",selected)

      const folderRef = `${violatorID}${selected}/${result.formattedDate.replaceAll("/","-")}-${result.formattedTime}`
      const imageRef = ref(storage,`${folderRef}/image`)
      const videoRef = ref(storage,`${folderRef}/video`)

      try{
        const response = await fetch(imageUri);
        const blob = await response.blob();
        await uploadBytesResumable(imageRef, blob);


        const response2 = await fetch(record);
        const blob2 = await response2.blob();
        await uploadBytesResumable(videoRef, blob2);
      } catch(err){
        console.log(err);
        
      }

      const img = await getDownloadURL(imageRef)
      const vid = await getDownloadURL(videoRef)

      await updateDoc(userRef,{
        history:[{type:2,date:result.formattedDate,time:result.formattedTime,violate:violate,image:img,video:vid,studentID:violatorID,student:violator,plateNumber:plateNumber,policeID:policeID},...history]
      })

      await updateDoc(schoolRef,{
        violation:[{type:2,date:result.formattedDate,time:result.formattedTime,violate:violate,image:img,video:vid,studentID:violatorID,student:violator,plateNumber:plateNumber,policeID:policeID},...violation]
      })

      setTimeout(()=>{
        setLoading(false)
        navigation.navigate("PHome")
      },1000)
    }else{
      Alert.alert("Missing something, please check again")
    }
  }

  const violates = [
    {key:1,value:"Không đội mũ bảo hiểm"},
    {key:2,value:"Lạng lách, đánh võng"},
    {key:3,value:"Đậu xe không đúng nơi quy định"},
    {key:4,value:"Không có bằng lái xe"},
    {key:5,value:"Vượt đèn đỏ/vàng"}
  ]
  

  return(
    <ScrollView style={{ flex: 1, backgroundColor: "white" }}>
    <View style={{ flex: 1, alignItems: "center", paddingBottom: 50 }}>
      <SelectList 
        setSelected={setSelected} 
        data={schools} 
        save="key"
        boxStyles={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
          width: "90%",
          marginTop: 20,
        }}
        placeholder={"Nhập tên trường"}
      />

<SelectList 
        setSelected={setViolate} 
        data={violates} 
        save="value"
        boxStyles={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
          width: "90%",
          marginTop: 20,
        }}
        placeholder={"Vi phạm"}
      />
      
      <TextInput value={id} onChangeText={id=>setID(id)} style={styles.input} placeholder={"Mã học sinh"} placeholderTextColor={"black"} />
      {violator &&
      <View style={{width:"100%",alignItems:"center"}}> 
        <Text style={[styles.input, { fontWeight: "bold", fontSize: 15 }]}>Họ và tên: {violator}</Text>
        <Text style={[styles.input, { fontWeight: "bold", fontSize: 15 }]}>Lớp: 12/X</Text>
      </View>
      }

      <TextInput onChangeText={text=>setPlateNumber(text)} style={styles.input} placeholder={"Biển số xe"} placeholderTextColor={"black"} />

      
      <View style={{ marginTop: 15, flexDirection: "row", justifyContent: "space-between", width: "90%" }}>
        <TouchableOpacity onPress={takePhoto} style={styles.record}>
          <Image style={{ width: 120, height: 120 }} source={require("./assets/add-folder.png")} /> 
          <Text style={{ fontWeight: "bold", fontSize: 16, textAlign: "center" }}>Ảnh vi phạm</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
          setIsRecording(true);
        }} style={styles.record}>
          <Image style={{ width: 120, height: 120 }} source={require("./assets/video.png")} /> 
          <Text style={{ fontWeight: "bold", fontSize: 16, textAlign: "center" }}>Video vi phạm</Text>
        </TouchableOpacity>
      </View>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={{ width: "90%", height: Dimensions.get("screen").height * 0.5, marginTop: 15, borderRadius: 10 }} resizeMode={"cover"} />
      )}

      {record &&(
        <Video
        source={{uri:record}}
        style={{ width: "90%", height: Dimensions.get("screen").height * 0.5, marginTop: 15, borderRadius: 10 }}
        resizeMode="cover"
        shouldPlay
        isLooping
        />
      )}

      <TouchableOpacity onPress={handleNotification} style={{marginTop:15, padding:15,borderRadius:10,width:"90%",alignItems:"center",backgroundColor:"orange"}}>
        <Text style={{fontSize:20,fontWeight:"bold",color:"white"}}>THÔNG BÁO</Text>
      </TouchableOpacity>

      {loading &&
        <ActivityIndicator size={"large"} color={"grey"}/>
      }
    </View>
  </ScrollView>
  )
}

function Police({ navigation,route }) {
  // const {id}=route.params
  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <ImageBackground source={require("./assets/background.jpg")} style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 10 }}>
        <Image style={styles.school} source={require("./assets/police.png")} />
        <Image style={{width:100,height:50,left:10,top:5}} source={require("./assets/vehiclesafety.png")} />

        <View style={styles.report}>
          <TouchableOpacity onPress={() => navigation.navigate("PSendNotification")} style={[styles.small_box, { alignItems: "center" }]}>
            <Image style={{ width: 90, height: 90 }} source={require("./assets/loudspeaker.png")} />
            <Text style={{ fontWeight: "bold", fontSize: 16, marginTop: 15 }}>Thông báo đối tượng</Text>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>vi phạm</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={()=>navigation.navigate("Plate")} style={[styles.small_box, { flexDirection: "column", alignItems: "center" }]}>
          <Image style={{ width: 100, height: 100 }} source={require("./assets/license.png")} />
          <Text style={{ fontWeight: "bold", fontSize: 16,marginTop:15 }}>Nhận diện biển số</Text>
        </TouchableOpacity>

        </View>

      <TouchableOpacity onPress={()=>navigation.navigate("Face")} style={[styles.large_box, { flexDirection: "column", alignItems: "center" }]}>
          <Image style={{ width: 100, height: 100 }} source={require("./assets/identified.png")} />
          <Text style={{ fontWeight: "bold", fontSize: 20 }}>Nhận diện khuôn mặt</Text>
        </TouchableOpacity>
      
 
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
}

function FaceRecognition({route}) {
  const {id}=route.params
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [search,setSearch]=useState()
  const [school,setSchool]=useState()
  const [data,setData]=useState()

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(()=>{
    async function handleData(){
      const user_info = await GetUser(search)
      const school = await GetUser(user_info?.school)
      setData(user_info)
      setSchool(school)
    }
    if(search){
      handleData()
    }
  },[search])

  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `${id}/scan/check.jpg`);
    await uploadBytesResumable(storageRef, blob);
const formData = await getDownloadURL(storageRef);

// Ensure the URL is valid and check the split operation
const urlSegment = formData.split("/")[7]; // Ensure this index is valid
if (urlSegment) {
  try{
    const responses = await fetch(`https://petite-bars-taste.loca.lt/${urlSegment}`);
    const data = await responses.json();
    console.log(data);
    setSearch(data.user_id)
  } catch(err){
    console.log(err)
  }
} else {
  console.error(urlSegment);
}
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photoData = await cameraRef.current.takePictureAsync();
      const resizedPhoto = await manipulateAsync(
        photoData.uri,
        [{ resize: { width: 356, height: 403 } }],
        { format: SaveFormat.JPEG }
      );
      await uploadImage(resizedPhoto.uri); // Upload the resized image
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <CameraView 
        ref={cameraRef} 
        style={{ justifyContent: "center", alignItems: "center", width: "90%", borderRadius: 10, height: Dimensions.get("screen").height * 0.4, marginTop: 20 }} 
        facing="front"
      />
      <TouchableOpacity 
        onPress={takePicture} 
        style={{ marginTop: 15, backgroundColor: "#3283a8", width: "90%", padding: 15, borderRadius: 10, alignItems: "center" }}
      >
        <Text style={{ fontWeight: "bold", color: "white", fontSize: 20 }}>Nhận diện khuôn mặt</Text>
      </TouchableOpacity>

      {data &&
        <View style={{width:"90%"}}>
          <Text style={[styles.input,{width:"100%"}]}>Trường: {school?.username}</Text>
          <Text style={[styles.input,{width:"100%",marginTop:10}]}>Mã CMND: {data?.id}</Text>
          <Text style={[styles.input,{width:"100%",marginTop:10}]}>Họ và tên: {data?.username}</Text>
          <Text style={[styles.input,{width:"100%",marginTop:10}]}>Lớp: 12/X</Text>
        </View>
      }
    </View>
  );
}

function PlateRecognition({route}) {
  const {id}=route.params
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [search,setSearch]=useState()
  const [school,setSchool]=useState()
  const [data,setData]=useState()

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(()=>{
    async function handleData(){
      const user_info = await GetUser(search)
      const school = await GetUser(user_info?.school)
      setData(user_info)
      setSchool(school)
    }
    if(search){
      handleData()
    }
  },[search])

  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `${id}/scan/check.jpg`);
    await uploadBytesResumable(storageRef, blob);
const formData = await getDownloadURL(storageRef);

// Ensure the URL is valid and check the split operation
const urlSegment = formData.split("/")[7]; // Ensure this index is valid
if (urlSegment) {
  try{
    const responses = await fetch(`https://quick-walls-dress.loca.lt/${urlSegment}`);
    const data = await responses.json();
    console.log(data);
    setSearch(data.user_id)
  } catch(err){
    console.log(err)
  }
} else {
  console.error(urlSegment);
}
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photoData = await cameraRef.current.takePictureAsync();
      const resizedPhoto = await manipulateAsync(
        photoData.uri,
        [{ resize: { width: 356, height: 403 } }],
        { format: SaveFormat.JPEG }
      );
      await uploadImage(resizedPhoto.uri); // Upload the resized image
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <CameraView 
        ref={cameraRef} 
        style={{ justifyContent: "center", alignItems: "center", width: "90%", borderRadius: 10, height: Dimensions.get("screen").height * 0.4, marginTop: 20 }} 
        facing="front"
      />
      <TouchableOpacity 
        onPress={takePicture} 
        style={{ marginTop: 15, backgroundColor: "#3283a8", width: "90%", padding: 15, borderRadius: 10, alignItems: "center" }}
      >
        <Text style={{ fontWeight: "bold", color: "white", fontSize: 20 }}>Nhận diện biển số</Text>
      </TouchableOpacity>

      {data &&
        <View style={{width:"90%"}}>
          <Text style={[styles.input,{width:"100%"}]}>Trường: {school?.username}</Text>
          <Text style={[styles.input,{width:"100%",marginTop:10}]}>Mã CMND: {data?.id}</Text>
          <Text style={[styles.input,{width:"100%",marginTop:10}]}>Họ và tên: {data?.username}</Text>
          <Text style={[styles.input,{width:"100%",marginTop:10}]}>Lớp: 12/X</Text>
        </View>
      }
    </View>
  );
}

function UpdateRule() {
  const API_KEY = "AIzaSyCjQywqV6MoVjR-y55UbMmh2WJLTA6O_hI";
  const [chat, setChat] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState();

  const handleUserInput = async () => {
    let updatedChat = [
      ...chat, {
        role: "user",
        parts: [{ text: userInput }]
      },
    ];
    setLoading(true);
    try {
      const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
        {
          contents: updatedChat
        }
      );
      const modelResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (modelResponse) {
        const updatedChatWithModel = [
          ...updatedChat, {
            role: "model",
            parts: [{ text: modelResponse }]
          }
        ];
        setChat(updatedChatWithModel);
        setUserInput("");
      }
    } catch (err) {
      setError(err.message || "An error occurred"); // Use `err.message` to display only the error message
      console.log(err); // Log the full error for debugging
    } finally {
      setLoading(false);
    }
  };

  const handleSpeech = async (text) => {
    if (isSpeaking) {
      stop();
      setIsSpeaking(false);
    } else {
      if (!(await isSpeakingAsync())) {
        speak(text);
        setIsSpeaking(true);
      }
    }
  };

  const renderChatItem = ({ item }) => (
    <ChatBubble role={item.role} text={item.parts[0].text} onSpeech={() => handleSpeech(item.parts[0].text)} />
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS == "ios" ? 'padding' : 'height'}>
      <View style={{ flex: 1, padding: 16, backgroundColor: "#f8f8f8" }}>
        <FlatList data={chat} renderItem={renderChatItem} keyExtractor={(item, index) => index.toString()} contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }} />
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
          <TextInput style={{ flex: 1, height: 50, marginRight: 10, padding: 8, borderColor: "#333", borderWidth: 1, borderRadius: 25, color: "#333", backgroundColor: "#fff" }} placeholder="Type your question..." placeholderTextColor="grey" value={userInput} onChangeText={text => setUserInput(text)} />
          <TouchableOpacity onPress={handleUserInput} style={{ padding: 10, backgroundColor: "#007AFF", borderRadius: 25 }}>
            <Text style={{ color: "#fff", textAlign: "center" }}>Send</Text>
          </TouchableOpacity>
        </View>
        {loading && <ActivityIndicator style={{ marginTop: 5 }} color="#333" />}
        {error && <Text style={{ color: "red", marginTop: 10 }}>{error}</Text>} 
      </View>
    </KeyboardAvoidingView>
  );
}
//school
function Compliant({route}){
  const {id}=route.params
  const [data,setData]=useState()
  const [news,setNew]=useState()
  const [isVisible,setIsVisible]=useState(false)
  useEffect(()=>{
    const getData = async ()=>{
        try{
            const user_info = await GetUser(id)
            setData(user_info)                
        } catch(err){
            console.error(err)
        }
    } 
    getData()
},[id])

  const handleNewCompliant = async()=>{
    if(news){
      const docRef = doc(db,"schoolalert",id)
      await updateDoc(docRef,{
        compliant: [...data?.compliant,news]
      })
    }
    setIsVisible(false)
  }

  return(
    <SafeAreaView style={{flex:1,backgroundColor:"white",alignItems:"center"}}>
      <ReactNativeModal style={{flex:1,alignItems:"center",justifyContent:"center"}} isVisible={isVisible} backdropOpacity={0} onBackdropPress={()=>setIsVisible(false)} >
        <View style={{width:"100%",backgroundColor:"white",padding:20,borderRadius:10,shadowColor: '#000',shadowOffset: { width: 2, height: 0 },shadowOpacity: 0.3,shadowRadius: 4,elevation: 5}}>
          <Text style={{fontWeight:"500",fontSize:18}}>Thêm thỏa thuận</Text>
          <TextInput onChangeText={news=>setNew(news)} style={[styles.input,{marginTop:10,padding:10,width:"100%"}]} placeholder="Nội dung thỏa thuận" placeholderTextColor={"gray"}/>
          <TouchableOpacity onPress={handleNewCompliant} style={{alignSelf:"flex-end",backgroundColor:"orange",marginTop:10,padding:10,paddingHorizontal:15,borderRadius:10}}>
            <Text style={{color:"white",fontWeight:"bold"}}>Add</Text>
          </TouchableOpacity>
        </View>
      </ReactNativeModal>
      <View style={{width:"90%",padding:30,borderRadius:10,backgroundColor:"#29084a",marginTop:20}}>
        <Text style={{color:"white",fontWeight:"bold",fontSize:20}}>Thỏa thuận</Text>
        <Text style={{marginTop:5,color:"white"}}>Kính thưa Qúy phụ huynh</Text>
        <Text style={{marginTop:15,color:"white"}}>Nhằm đảm bảo an toàn và tuân thủ luật lệ giao thông cho học sinh, Trường {data?.username} cam kết cung cấp các quy định rõ ràng, minh bạch. Chúng tôi mong nhận được sự đồng hành và ủng hộ từ phía phụ huynh trong việc hướng dẫn và giám sát con em thực hiện tốt các quy định này.</Text>

        <TouchableOpacity onPress={()=>setIsVisible(true)} style={{marginTop:10,backgroundColor:"white",padding:10,width:"50%",borderRadius:10,alignItems:"center"}}>
          <Text>Thêm thỏa thuận mới</Text>
        </TouchableOpacity>
      </View>

      <FlatList
      data={data?.compliant}
      keyExtractor={(item,index)=>index.toLocaleString()}
      showsVerticalScrollIndicator
      style={{marginTop:10,width:"100%"}}
      renderItem={({item,index})=>(
        <TouchableOpacity style={{width:"100%",padding:20,borderRadius:16,shadowColor: '#000',shadowOffset: { width: 2, height: 0 },shadowOpacity: 0.3,shadowRadius: 4,elevation: 5,flexDirection:"row",alignItems:"center"}}>
          <Text style={{fontSize:30}}>{String(Number(index)+1).padStart(2,'0')}</Text>
          <Text style={{fontSize:14,marginLeft:10}}>{item}</Text>
        </TouchableOpacity>
      )}
      />
    </SafeAreaView>
  )
}

function SchoolSendNotification({route,navigation}) {
  const {idSchool}=route.params
  const today = new Date()
  const [schools, setSchools] = useState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      const schoolsList = await GetUser(idSchool); // Wait for the data to be fetched
      setSchools(schoolsList);
      setLoading(false);
    };

    fetchSchools();
  }, []);

  function formatDateAndTime(date) {
    // Format the date as DD/MM/YYYY
    const day = String(date.getDate()).padStart(2, '0'); // Get day and pad with leading zero
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const year = date.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    // Get hours and minutes
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const second = date.getSeconds()


    // Determine the time of day
    let timeOfDay;
    if (hours < 12) {
        timeOfDay = "Morning";
    } else if (hours < 17) {
        timeOfDay = "Afternoon";
    } else {
        timeOfDay = "Evening";
    }

    // Format time as HH:MM
    const formattedTime = `${String(hours).padStart(2, '0')}:${minutes}:${second}`;

    return {
        formattedDate,
        timeOfDay,
        formattedTime
    };
  }

  const result = formatDateAndTime(today)

  const [selected, setSelected] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [hasAudioPermission, setHasAudioPermission] = useState(null);
  const [hasCameraPermission, setHasCameraPermission] =useState(null);
  const [record, setRecord] = useState(null);
  const [isRecording,setIsRecording]=useState(false)
  const [camera,setCamera]=useState(false)
  const cameraRef = useRef(null)
  const [id,setID]=useState()
  const [violator,setViolator]=useState()
  const [violatorID,setViolatorID]=useState()
  const [violate,setViolate]=useState()
  const [explain,setExplain]=useState()
  const [plateNumber,setPlateNumber]=useState()
  const [isVisible,setIsVisible]=useState(false)
  const [isVisible2,setIsVisible2]=useState(false)
  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');
const audioStatus = await Camera.requestMicrophonePermissionsAsync();
      setHasAudioPermission(audioStatus.status === 'granted');
})();
  }, []);

  useEffect(()=>{
    async function getData(){
      if(id){
        const userID = await GetDocIDFromUserID(id)
        const user_info = await GetUser(userID)
        
        setViolator(user_info.username)
        setViolatorID(userID)
      }
    }

    getData()
  },[id])

  // Take photo function
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } else {
      console.log('Camera permission not granted');
    }
  };
  
  const handleRecord = async () => {
    if (camera) {
      await cameraRef.current?.stopRecording();

      setTimeout(()=>{
        setCamera(false);
        setIsRecording(false)
      },1000)
      // return;
    }
    setCamera(true);
    const video = await cameraRef.current?.recordAsync();
    setRecord(video.uri)
  };

  if(isRecording){
    return(
      <CameraView ref={cameraRef} mode="video" style={{flex:1}}>
        <TouchableOpacity onPress={handleRecord}  style={[styles.error,{backgroundColor:"white",width:60,height:60,borderRadius:30,alignItems:"center",justifyContent:"center",position:"absolute",bottom:50,right:173}]}>
          <View style={styles.error}/>
        </TouchableOpacity>
      </CameraView>
    )
  }

  const handleNotification = async()=>{
    if(violatorID && imageUri && record && violate && explain && plateNumber){
      const user_info = await GetUser(violatorID)
      const school_info = schools
      setLoading(true)
  
      const history = user_info.history
      const violation = school_info.violation

      const userRef = doc(db,"schoolalert",violatorID)
      const schoolRef = doc(db,"schoolalert",idSchool)

      const folderRef = `${violatorID}${idSchool}/${result.formattedDate.replaceAll("/","-")}-${result.formattedTime}`
      const imageRef = ref(storage,`${folderRef}/image`)
      const videoRef = ref(storage,`${folderRef}/video`)

      try{
        const response = await fetch(imageUri);
        const blob = await response.blob();
        await uploadBytesResumable(imageRef, blob);

        const response2 = await fetch(record);
        const blob2 = await response2.blob();
        await uploadBytesResumable(videoRef, blob2);
      } catch(err){
        console.log(err);
        
      }

      const img = await getDownloadURL(imageRef)
      const vid = await getDownloadURL(videoRef)

      await updateDoc(userRef,{
        history:[{type:1,date:result.formattedDate,time:result.formattedTime,violate:violate,image:img,video:vid,schoolID:idSchool,student:violator,explain:explain,plateNumber:plateNumber,policeID:idSchool},...history]
      })

      await updateDoc(schoolRef,{
        violation:[{type:1,date:result.formattedDate,time:result.formattedTime,violate:violate,image:img,video:vid,studentID:violatorID,student:violator,explain:explain,plateNumber:plateNumber,policeID:idSchool},...violation]
      })

      setTimeout(()=>{
        setLoading(false)
        navigation.navigate("SHome")
      },1000)
    }else{
      Alert.alert("Missing something, please check again")
    }
  }

  
  const violates = [
    {key:1,value:"Không đội mũ bảo hiểm"},
    {key:2,value:"Lạng lách, đánh võng"},
    {key:3,value:"Đậu xe không đúng nơi quy định"},
    {key:4,value:"Không có bằng lái xe"},
    {key:5,value:"Vượt đèn đỏ/vàng"}
  ]
  
  const getPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } else {
      console.log('Camera permission not granted');
    }
  };

  return(
    <ScrollView style={{ flex: 1, backgroundColor: "white" }}>
      <ReactNativeModal isVisible={isVisible} onBackdropPress={()=>setIsVisible(false)} backdropOpacity={0.2}>
        <View style={{width:"50%",backgroundColor:"white",padding:10,borderRadius:10,marginLeft:30}}>
          <TouchableOpacity onPress={takePhoto} style={{alignSelf:"center"}}>
            <Text>Máy ảnh</Text>
          </TouchableOpacity>
          <View style={{borderTopWidth:1,marginVertical:10}}></View>
          <TouchableOpacity onPress={getPhoto} style={{alignSelf:"center"}}>
            <Text>Kho ảnh</Text>
          </TouchableOpacity>
        </View>
      </ReactNativeModal>
    <View style={{ flex: 1, alignItems: "center", paddingBottom: 50 }}>
      <Text style={styles.input}>Trường: {schools?.username}</Text>

<SelectList 
        setSelected={setViolate} 
        data={violates} 
        save="value"
        boxStyles={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
          width: "90%",
          marginTop: 20,
        }}
        placeholder={"Vi phạm"}
      />
      
      <TextInput onChangeText={id=>setID(id)} style={styles.input} placeholder={"Mã CCCD"} placeholderTextColor={"black"} />
      <TextInput onChangeText={text=>setPlateNumber(text)} style={styles.input} placeholder={"Biển số xe"} placeholderTextColor={"black"} />
      <TextInput onChangeText={explain=>setExplain(explain)} style={styles.input} placeholder={"Mô tả thời gian,địa điểm vi phạm"} placeholderTextColor={"black"} />
      {violator &&
      <View style={{width:"100%",alignItems:"center"}}> 
        <Text style={[styles.input, { fontWeight: "bold", fontSize: 15 }]}>Họ và tên: {violator}</Text>
        <Text style={[styles.input, { fontWeight: "bold", fontSize: 15 }]}>Lớp: 12/X</Text>
      </View>
      }
      
      <View style={{ marginTop: 15, flexDirection: "row", justifyContent: "space-between", width: "90%" }}>
        <TouchableOpacity onPress={()=>setIsVisible(true)} style={styles.record}>
          <Image style={{ width: 120, height: 120 }} source={require("./assets/add-folder.png")} /> 
          <Text style={{ fontWeight: "bold", fontSize: 16, textAlign: "center" }}>Ảnh vi phạm</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
          setIsRecording(true)
        }} style={styles.record}>
          <Image style={{ width: 120, height: 120 }} source={require("./assets/video.png")} /> 
          <Text style={{ fontWeight: "bold", fontSize: 16, textAlign: "center" }}>Video vi phạm</Text>
        </TouchableOpacity>
      </View>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={{ width: "90%", height: Dimensions.get("screen").height * 0.5, marginTop: 15, borderRadius: 10 }} resizeMode={"cover"} />
      )}

      {record &&(
        <Video
        source={{uri:record}}
        style={{ width: "90%", height: Dimensions.get("screen").height * 0.5, marginTop: 15, borderRadius: 10 }}
        resizeMode="cover"
        shouldPlay
        isLooping
        />
      )}

      <TouchableOpacity onPress={handleNotification} style={{marginTop:15, padding:15,borderRadius:10,width:"90%",alignItems:"center",backgroundColor:"orange"}}>
        <Text style={{fontSize:20,fontWeight:"bold",color:"white"}}>THÔNG BÁO</Text>
      </TouchableOpacity>

      {loading &&
        <ActivityIndicator size={"large"} color={"grey"}/>
      }
    </View>
  </ScrollView>
  )
}

function School({navigation,route}){
  const today =new Date()
  const {id}=route.params
  const [avatar,setAvatar]=useState()
  const [data,setData]=useState()

  function formatDateAndTime(date) {
    // Format the date as DD/MM/YYYY
    const day = String(date.getDate()).padStart(2, '0'); // Get day and pad with leading zero
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const year = date.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    // Get hours and minutes
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');

    // Determine the time of day
    let timeOfDay;
    if (hours < 12) {
        timeOfDay = "Morning";
    } else if (hours < 17) {
        timeOfDay = "Afternoon";
    } else {
        timeOfDay = "Evening";
    }

    // Format time as HH:MM
    const formattedTime = `${String(hours).padStart(2, '0')}:${minutes}`;

    return {
        formattedDate,
        timeOfDay,
        formattedTime
    };
  }

  const result = formatDateAndTime(today)
  
  useEffect(()=>{
    const getData = async ()=>{
        try{
            const user_info = await GetUser(id)
            setData(user_info)            
            const avatar = await getImageFromStorage(id,"schoolavatar")
            setAvatar(avatar)              
        } catch(err){
            console.error(err)
        }
    } 
    getData()
},[id])
  const news = [
    {author:"Sức khỏe và đời sống",title:"25 phút cứu thanh niên 19 tuổi đa chấn thương do tai nạn giao thông",link:"https://suckhoedoisong.vn/25-phut-cuu-thanh-nien-19-tuoi-da-chan-thuong-do-tai-nan-giao-thong-169240626150038145.htm",key:0},
    {author:"Lao động",title:"Thiếu niên 16 tuổi lái xe máy gây tai nạn khiến 1 người ở Hải Phòng tử vong",link:"https://laodong.vn/xa-hoi/thieu-nien-16-tuoi-lai-xe-may-gay-tai-nan-khien-1-nguoi-o-hai-phong-tu-vong-1273612.ldo",key:1},
    {author:"Dân trí",title:"Thanh niên 17 tuổi lái xe máy gây tai nạn chết người",link:"https://dantri.com.vn/phap-luat/thanh-nien-17-tuoi-lai-xe-may-gay-tai-nan-chet-nguoi-20240722112235843.htm",key:2}
  ]
  const notification = data?.violation?.filter(item=>item.date === result.formattedDate).length
  return(
    <TouchableWithoutFeedback onPress={()=>Keyboard.dismiss()}>
    <ImageBackground source={require("./assets/background.jpg")} style={{flex:1,justifyContent:"center",alignItems:"center",paddingHorizontal:10}}>
      <Image style={styles.school} source={{uri:avatar}}/>
      <Text style={styles.school_text}>{data?.username}</Text>

      <View style={styles.report}>
        <TouchableOpacity onPress={()=>navigation.navigate("SSendNotification")} style={[styles.small_box,{alignItems:"center"}]}>
          <Image style={{width:90,height:90}} source={require("./assets/loudspeaker.png")}/>
          <Text style={{fontWeight:"bold",fontSize:16,marginTop:15}}>Thông báo đối tượng</Text>
          <Text style={{fontWeight:"bold",fontSize:16}}>vi phạm</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={()=>navigation.navigate("Rule")} style={[styles.small_box,{alignItems:"center"}]}>
          <Image style={{width:90,height:90,marginTop:10}} source={require("./assets/compliant.png")}/>
          <Text style={{fontWeight:"bold",fontSize:16,marginTop:15}}>Cập nhật thỏa thuận</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.report}>
      <TouchableOpacity onPress={()=>navigation.navigate("Face")} style={[styles.small_box, { flexDirection: "column", alignItems: "center" }]}>
          <Image style={{ width: 100, height: 100 }} source={require("./assets/identified.png")} />
          <Text style={{ fontWeight: "bold", fontSize: 16 }}>Nhận diện khuôn mặt</Text>
        </TouchableOpacity>
      
      <TouchableOpacity style={[styles.small_box,{flexDirection:"column",alignItems:"center"}]}>
          <View style={styles.error}><Text style={styles.number}>{notification}</Text></View>
          <Text style={[styles.alert,{textAlign:"center"}]}>You have {notification} new alert!</Text>
          <TouchableOpacity onPress={()=>navigation.navigate("SNotification")} style={styles.button}>
            <Text style={styles.text_button}>Go to Notification</Text>
          </TouchableOpacity>
      </TouchableOpacity>
      </View>



      <View style={{marginTop:15}}>
        <FlatList
        data={news}
        keyExtractor={(__,index)=>index.toString()}
        style={{maxHeight:150}}
        horizontal
        showsHorizontalScrollIndicator={true}
        pagingEnabled
        scrollEventThrottle={16}

        renderItem={({item,index})=>{
          return(
            <View>
              <BackImage index={index} item={item}/>
            </View>
          )
        }}/>
      </View>
    </ImageBackground>
    </TouchableWithoutFeedback> 
  )
}

function SchoolNotification({route,navigation}){
  const {id}=route.params
  const [data,setData]=useState()
  const [student,setStudent]=useState()
  useEffect(() => {
    const fetchSchools = async () => {
      const schoolsList = await GetUser(id);
      setData(schoolsList);
    };

    fetchSchools();
  }, []);
  const notifications = [
    {type:"police", violate:"Không có bằng lái xe", date:"03/10/2024",image:"https://baolaichau.vn/uploaded/post/2022/12/19/1-5_1671420279499.jpg",video:"https://www.youtube.com/watch?v=sQ5xcwnnzE4&rco=1"},
    {type:"school", violate:"Không đội mũ bảo hiểm", date:"03/10/2024",image:"https://baolaichau.vn/uploaded/post/2022/12/19/1-5_1671420279499.jpg",video:"https://www.youtube.com/watch?v=sQ5xcwnnzE4&rco=1"},
  ]
  const video = useRef(null)
  const [status, setStatus] = useState({})
  const [selectedIndex,setSelectedIndex]=useState(null)
  const handleNotification = (index)=>{
    if(selectedIndex == null){
      setSelectedIndex(index)
    } else{
      setSelectedIndex(null)
    }
  }
  return(
    <View style={{flex:1}}>
      <FlatList
      data={data?.violation}
      keyExtractor={(__,index)=>index.toString()}
      style={{flex:1,alignSelf:"center",marginTop:20,width:"100%"}}
      renderItem={({item,index})=>{
        return(
          <View style={styles.notification}>
            <TouchableOpacity style={styles.boxes} onPress={()=>handleNotification(index)}>
              <View style={[styles.error,{backgroundColor: item.type==1 ? "#3246a8" : "#f70a22"}]}>
                <Text style={[styles.number,{fontSize:30}]}>!</Text>
              </View>

              <View style={styles.violate_content}>
                <Text style={styles.violate}>{item.violate}</Text>
                <Text style={styles.date}>{item.date}</Text>
              </View>
            </TouchableOpacity>

            <Text style={{alignSelf:"center",fontSize:17}}>⧪</Text>

            {selectedIndex == index && 
              <View  style={{marginTop:5}}>
                <Text style={styles.violate}>Họ và tên: {item.student}</Text>
                <Text style={styles.violate}>Lớp: 12/X</Text>
                {item?.type == 1 && 
                    <Text style={styles.violate}>Mô tả: {item?.explain}</Text>
                }
                <Text style={{fontSize:18}}>Hình ảnh vi phạm:</Text>

                <Image style={{width:"100%",height:Dimensions.get("screen").height*0.3,marginTop:5,borderRadius:8}} source={{uri:item?.image}}/>

                <Text style={{fontSize:18,marginTop:5}}>Video vi phạm</Text>
                <Video
                ref={video}
                style={{width:"100%",height:Dimensions.get("screen").height*0.3,marginTop:5,borderRadius:8}}
                source={{uri:item?.video}}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                onPlaybackStatusUpdate={status =>setStatus(()=>status)}/>

                <TouchableOpacity style={[styles.button,{width:"100%",padding:15}]} onPress={()=>status.isPlaying ? video.current.pauseAsync() : video.current.playAsync()}>
                  {item.video != null ?(
                    <Text style={styles.text_button}>
                      {status.isPlaying ? "Pause" : "Play"}
                    </Text>
                  ):(
                    <Text style={styles.text_button}>
                      Không tìm thấy video
                    </Text>
                  )}
                </TouchableOpacity>

                {item?.type == 1 ? (
                  <View>
                    <TouchableOpacity onPress={()=>navigation.navigate("SChat",{id2:item?.studentID})} style={[styles.button,{width:"100%",padding:15}]}>
                      <Text style={styles.text_button}>Liên hệ phụ huynh</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={()=>navigation.navigate("Violation",{id2:item?.policeID,information:item})} style={[styles.button,{width:"100%",padding:15}]}>
                      <Text style={styles.text_button}>Biên bản vi phạm</Text>
                    </TouchableOpacity>
                  </View>
                ):(
                  <View>
                    <TouchableOpacity onPress={()=>navigation.navigate("Punish",{id2:item?.policeID,information:item})} style={[styles.button,{width:"100%",padding:15}]}>
                      <Text style={styles.text_button}>Biên bản xử phạt</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            }


          </View>
        )
      }}
      ItemSeparatorComponent={()=>(<View style={{marginTop:15}}></View>)}/>
    </View>
  )
}


//app

export default function App(){
  return(
    <NavigationContainer independent={true}>
      <Stack.Navigator initialRouteName="Login" screenOptions={{headerShown:false}}>
        <Stack.Screen component={Signup} name="Signup"/>
        <Stack.Screen component={Login} name="Login"/>
        <Stack.Screen component={PoliceRoute} name="PoliceRoute"/>
        <Stack.Screen component={SchoolRoute} name="SchoolRoute"/>  
        <Stack.Screen component={ParentRoute} name="ParentRoute"/>
      </Stack.Navigator>
    </NavigationContainer>
  )
}