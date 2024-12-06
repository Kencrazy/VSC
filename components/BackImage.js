import { StyleSheet, Text, View,useWindowDimensions,TouchableOpacity,Linking } from 'react-native'
import React from 'react'


const BackImage = ({index,item}) => {
  const handlePress = async()=>{
    await Linking.openURL(item.link)
  }

  const {width}=useWindowDimensions()  
  return (
    <TouchableOpacity onPress={handlePress} style={{width:width*0.95,backgroundColor:"white",borderRadius:10,padding:15,height:150}}>
      <Text style={{fontSize:22,fontWeight:"bold"}}>{item.title}</Text>
      <Text style={{alignSelf:"flex-end",marginTop:10,fontSize:20,position:"absolute",bottom:15,right:15}}>~{item.author}~</Text>
    </TouchableOpacity>
  )
}

export default BackImage

const styles = StyleSheet.create({})