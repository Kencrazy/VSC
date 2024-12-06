import React from "react";
import { View,Text,Image,TouchableOpacity,StyleSheet } from "react-native";
export default function ChatBubble ({role,text,onSpeech}){
    return(
        <View style={[styles.chatItem, role == "user" ? styles.userChatItem : styles.modelChatItem]}>
            <Text style={styles.chatText}>{text}</Text>
            {role == "model" && (
                <TouchableOpacity onPress={onSpeech} style={styles.speakerIcon}>
                    <Image source={require("./assets/volume-up.png")}/>
                </TouchableOpacity>
            )}
        </View>
    )
}

const styles =StyleSheet.create({
    chatItem:{
        marginBottom:10,
        padding:10,
        borderRadius:10,
        maxWidth:"70%",
        position:"relative"
    },
    userChatItem:{
        alignSelf:"flex-end",
        backgroundColor:"blue",
    },
    modelChatItem:{
        alignSelf:"flex-start",
        backgroundColor:"#000"
    },
    chatText:{
        fontSize:16,
        color:"#fff"
    },
    speakerIcon:{
        position:"absolute",
        bottom:5,right:5
    }
})